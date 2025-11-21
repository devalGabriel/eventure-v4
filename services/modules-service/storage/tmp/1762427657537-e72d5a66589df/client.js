// events-client v1.1.0 (advanced)
// - Config runtime from data-config or window.__MODULE_CONFIG__
// - Admin settings mode via data-mode="settings" + postMessage to host
(() => {
  const root = document.getElementById('module-root');
  if (!root) { console.error('[events-client] Missing #module-root'); return; }

  // ---------- Config ----------
  const DEFAULT_CONFIG = {
    apiBase: root.getAttribute('data-api') || 'http://localhost:4003',
    providersApiBase: '',
    auth: { strategy: 'cookies', bearerVar: 'window.__AUTH_TOKEN__' },
    defaults: {
      currency: 'RON', location: '',
      eventType: 'wedding', timezone: 'Europe/Bucharest', dateFormat: 'yyyy-MM-dd HH:mm'
    },
    filters: { status: '', pageSize: 20 },
    ui: { hideSections: [], optimisticUpdates: true, notifications: false, locale: 'ro' },
    integrations: { enableProviderLookup: false, providerSearchMinChars: 3, providerSearchDebounceMs: 350 }
  };

  function parseJsonAttr(attr) {
    try { return JSON.parse(attr); } catch { return null; }
  }

  const configFromAttr = parseJsonAttr(root.getAttribute('data-config'));
  const configFromGlobal = (window.__MODULE_CONFIG__ && window.__MODULE_CONFIG__['events-client']) || null;
  const CFG = deepMerge(DEFAULT_CONFIG, configFromAttr || configFromGlobal || {});

  function deepMerge(base, extra) {
    if (!extra || typeof extra !== 'object') return structuredClone(base);
    const out = structuredClone(base);
    (function assign(dst, src) {
      for (const k of Object.keys(src)) {
        if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
          if (!dst[k] || typeof dst[k] !== 'object') dst[k] = {};
          assign(dst[k], src[k]);
        } else {
          dst[k] = src[k];
        }
      }
    })(out, extra);
    return out;
  }

  const LOCALE = CFG.ui.locale || (document.documentElement.lang || 'ro');

  // ---------- API helper ----------
  async function apiFetch(path, opts = {}) {
    const url = `${CFG.apiBase}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (CFG.auth.strategy === 'bearer') {
      const token = eval(CFG.auth.bearerVar); // ex: window.__AUTH_TOKEN__
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers,
      credentials: CFG.auth.strategy === 'cookies' ? 'include' : 'omit',
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (!res.ok) {
      let detail = '';
      try { const j = await res.json(); detail = j.error || j.details || res.statusText; } catch {}
      throw new Error(`${res.status} ${detail}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // (optional) provider lookup
  let providerLookup = async (q) => [];
  if (CFG.integrations.enableProviderLookup && CFG.providersApiBase) {
    providerLookup = debounce(async (q) => {
      if (!q || q.length < CFG.integrations.providerSearchMinChars) return [];
      const url = `${CFG.providersApiBase}/providers/search?q=${encodeURIComponent(q)}&limit=10`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      // normalize to [{id, label}]
      return (data.items || data || []).map(p => ({ id: p.id || p.userId || p.slug, label: p.name || p.displayName || p.email || p.id }));
    }, CFG.integrations.providerSearchDebounceMs);
  }

  // ---------- State ----------
  const state = {
    page: location.hash.slice(1) || '/',
    events: [],
    meta: { total: 0, page: 1, pageSize: CFG.filters.pageSize },
    current: null,
    filters: { status: CFG.filters.status },
    loading: false,
    error: ''
  };

  function setState(patch) { Object.assign(state, patch); render(); }

  // ---------- Utils ----------
  function fmtDate(d) { try { return new Date(d).toLocaleString(LOCALE); } catch { return d; } }
  function pill(v){ return `<span class="pill">${v}</span>`; }
  function qs(o){ return Object.entries(o).filter(([,v])=>v!==''&&v!=null).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'); }
  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }

  // ---------- Styles ----------
  injectStyles(`
    .evc { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 16px; }
    .evc h1 { font-size: 20px; margin: 0 0 12px; }
    .evc .row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .evc .card { border:1px solid #e5e7eb; border-radius:12px; padding:12px; margin:8px 0; background:#fff; }
    .evc .btn { padding:8px 12px; border:1px solid #e5e7eb; border-radius:8px; cursor:pointer; background:#fff; }
    .evc .btn.primary { background:#111827; color:#fff; border-color:#111827; }
    .evc input, .evc select, .evc textarea { padding:8px; border:1px solid #e5e7eb; border-radius:8px; }
    .evc label { font-size:12px; color:#6b7280; display:block; margin-top:8px; }
    .evc .muted { color:#6b7280; font-size:12px; }
    .evc .grid { display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap:12px; }
    @media (max-width: 800px){ .evc .grid { grid-template-columns: 1fr; } }
    .evc .kvs { display:flex; gap:8px; flex-wrap:wrap; font-size:12px; color:#374151; }
    .evc .pill { padding:4px 8px; border-radius:999px; border:1px solid #e5e7eb; background:#f9fafb; }
    .evc .list { margin:0; padding:0; list-style:none; }
    .evc .list li { padding:8px 0; border-bottom:1px dashed #e5e7eb; }
    .evc .toolbar { display:flex; gap:8px; flex-wrap:wrap; justify-content:space-between; }
    .evc .grow { flex:1 1 auto; min-width:220px; }
    .evc .error { border-color:#ef4444;color:#991b1b;background:#fff1f2 }
  `);

  function injectStyles(css){
    const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);
  }

  // ---------- Views ----------
  async function loadList() {
    setState({ loading:true, error:'' });
    try{
      const q = { page: state.meta.page, pageSize: state.meta.pageSize, status: state.filters.status };
      const data = await apiFetch(`/events?${qs(q)}`);
      setState({ events: data.items, meta: { total: data.total, page: data.page, pageSize: data.pageSize } });
    } catch(e){ setState({ error:e.message }); }
    finally{ setState({ loading:false }); }
  }

  async function loadDetails(id){
    setState({ loading:true, error:'', current:null });
    try{ const data = await apiFetch(`/events/${id}`); setState({ current: data }); }
    catch(e){ setState({ error:e.message }); }
    finally{ setState({ loading:false }); }
  }

  // advanced: patch status
  async function patchStatus(id, status){
    try{
      const updated = await apiFetch(`/events/${id}`, { method:'PUT', body:{ status } });
      if (CFG.ui.optimisticUpdates) {
        // reflect in state
        if (state.current?.id === id) state.current.status = updated.status;
        const idx = state.events.findIndex(e=>e.id===id); if (idx>-1) state.events[idx].status = updated.status;
        render();
      } else {
        await Promise.all([loadDetails(id), loadList()]);
      }
    } catch(e){ alert(e.message); }
  }

  async function createEvent(payload){
    setState({ loading:true });
    try{
      const body = {
        name: payload.name,
        type: payload.type || CFG.defaults.eventType,
        description: payload.description || undefined,
        startDate: payload.startDate,
        endDate: payload.endDate || undefined,
        location: payload.location || CFG.defaults.location || undefined,
        currency: payload.currency || CFG.defaults.currency
      };
      const e = await apiFetch('/events', { method:'POST', body });
      location.hash = `#/${e.id}`;
    } catch(e){ alert(`Eroare: ${e.message}`); }
    finally{ setState({ loading:false }); }
  }

  // tasks / invites / messages / attachments – la fel ca înainte:
  async function addTask(eventId,payload){ try{ await apiFetch(`/events/${eventId}/tasks`,{method:'POST', body:payload}); await loadDetails(eventId);}catch(e){alert(e.message);} }
  async function updateTask(taskId, payload, eventId){ try{ await apiFetch(`/tasks/${taskId}`,{method:'PUT', body:payload}); await loadDetails(eventId);}catch(e){alert(e.message);} }
  async function inviteProvider(eventId, payload){ try{ await apiFetch(`/events/${eventId}/invitations`,{method:'POST', body:payload}); await loadDetails(eventId);}catch(e){alert(e.message);} }
  async function postMessage(eventId, body){ try{ await apiFetch(`/events/${eventId}/messages`,{method:'POST', body:{ body }}); await loadDetails(eventId);}catch(e){alert(e.message);} }
  async function addAttachment(eventId, payload){ try{ await apiFetch(`/events/${eventId}/attachments`,{method:'POST', body:payload}); await loadDetails(eventId);}catch(e){alert(e.message);} }

  function renderToolbar(){
    return `
      <div class="toolbar card">
        <div class="row grow">
          <input class="grow" id="flt-q" placeholder="Căutare (nume/locație) — client side">
          <select id="flt-status">
            <option value="">Orice status</option>
            <option>DRAFT</option><option>PLANNING</option><option>ACTIVE</option><option>COMPLETED</option><option>CANCELED</option>
          </select>
          <select id="flt-ps">
            ${[10,20,50,100].map(s=>`<option value="${s}" ${s===state.meta.pageSize?'selected':''}>${s}/pag</option>`).join('')}
          </select>
        </div>
        <div class="row">
          <button class="btn" id="btn-refresh">Reîncarcă</button>
          <button class="btn primary" id="btn-new">Eveniment nou</button>
        </div>
      </div>
    `;
  }

  function renderList(){
    const q = document.querySelector('#flt-q')?.value?.toLowerCase() || '';
    const filtered = !q ? state.events : state.events.filter(e =>
      (e.name||'').toLowerCase().includes(q) || (e.location||'').toLowerCase().includes(q)
    );

    const items = filtered.map(e => `
      <div class="card">
        <div class="row" style="justify-content:space-between;">
          <div>
            <div><strong>${e.name}</strong></div>
            <div class="kvs">
              ${pill(e.type)}${pill(e.status)}${pill(e.currency)}
            </div>
            <div class="muted">${fmtDate(e.startDate)}${e.location ? ' · ' + e.location : ''}</div>
          </div>
          <div class="row">
            <select data-ev-status="${e.id}">
              ${['DRAFT','PLANNING','ACTIVE','COMPLETED','CANCELED'].map(s=>`<option ${e.status===s?'selected':''}>${s}</option>`).join('')}
            </select>
            <button class="btn" data-ev-open="${e.id}">Deschide</button>
          </div>
        </div>
      </div>
    `).join('') || `<div class="muted">Nu există evenimente.</div>`;

    const pagInfo = `<div class="muted">Total: ${state.meta.total} • Pag: ${state.meta.page}/${Math.max(1,Math.ceil(state.meta.total/state.meta.pageSize))}</div>`;

    return renderToolbar() + items + pagInfo;
  }

  function renderNewForm(){
    return `
      <h1>Eveniment nou</h1>
      <div class="card">
        <div class="grid">
          <div><label>Nume</label><input id="f-name" placeholder="Ex: Nunta Maria & Andrei"></div>
          <div><label>Tip</label>
            <select id="f-type">
              <option value="wedding" ${CFG.defaults.eventType==='wedding'?'selected':''}>wedding</option>
              <option value="baptism" ${CFG.defaults.eventType==='baptism'?'selected':''}>baptism</option>
              <option value="corporate" ${CFG.defaults.eventType==='corporate'?'selected':''}>corporate</option>
            </select>
          </div>
          <div><label>Data & ora</label><input id="f-start" type="datetime-local"></div>
          <div><label>Locație</label><input id="f-location" placeholder="București" value="${escapeHtml(CFG.defaults.location)}"></div>
          <div><label>Monedă</label><input id="f-currency" value="${escapeHtml(CFG.defaults.currency)}"></div>
          <div style="grid-column:1/-1"><label>Descriere</label><textarea id="f-desc" rows="3"></textarea></div>
        </div>
        <div class="row" style="margin-top:12px; gap:12px;">
          <button class="btn" id="btn-cancel">Renunță</button>
          <button class="btn primary" id="btn-save">Creează</button>
        </div>
      </div>
    `;
  }

  function renderDetails(){
    const e = state.current;
    if (!e) return `<div class="muted">Se încarcă...</div>`;

    const sectionVisible = (name) => !CFG.ui.hideSections.includes(name);

    const tasks = (e.tasks||[]).map(t=>`
      <li class="row" style="justify-content:space-between;">
        <div><strong>${t.title}</strong><div class="muted">${t.status}${t.dueDate? ' · '+fmtDate(t.dueDate):''}</div></div>
        <div class="row">
          ${t.status!=='DONE'? `<button class="btn" data-task-done="${t.id}">DONE</button>`:''}
        </div>
      </li>
    `).join('');

    const invites = (e.invitations||[]).map(i=>`<li><strong>${i.invitedId}</strong> – ${i.role} · <span class="muted">${i.status}</span></li>`).join('');
    const msgs = (e.messages||[]).map(m=>`<li><strong>${m.authorId}</strong>: ${m.body} <span class="muted">(${fmtDate(m.createdAt)})</span></li>`).join('');
    const atts = (e.attachments||[]).map(a=>`<li><a href="${a.url}" target="_blank" rel="noreferrer">${a.filename}</a> <span class="muted">(${a.mimeType}, ${a.sizeBytes} B)</span></li>`).join('');

    return `
      <div class="row" style="justify-content:space-between;">
        <h1>${e.name}</h1>
        <div class="row">
          <select id="ev-status">
            ${['DRAFT','PLANNING','ACTIVE','COMPLETED','CANCELED'].map(s=>`<option ${e.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <button class="btn" id="btn-back">Înapoi</button>
        </div>
      </div>

      <div class="kvs" style="margin-bottom:12px;">
        ${pill(e.type)}${pill(e.status)}${pill(fmtDate(e.startDate))}${e.location?pill(e.location):''}${pill(e.currency)}
      </div>

      <div class="grid">
        ${sectionVisible('tasks') ? `
        <div class="card">
          <h3>Taskuri</h3>
          <ul class="list">${tasks || '<li class="muted">Niciun task.</li>'}</ul>
          <div class="row" style="margin-top:8px; gap:8px;">
            <input id="t-title" placeholder="Titlu task">
            <input id="t-due" type="date">
            <button class="btn" id="btn-add-task">Adaugă</button>
          </div>
        </div>`:''}

        ${sectionVisible('invitations') ? `
        <div class="card">
          <h3>Invitații (providers)</h3>
          <ul class="list">${invites || '<li class="muted">Nicio invitație.</li>'}</ul>
          <div class="row" style="margin-top:8px; gap:8px;">
            ${CFG.integrations.enableProviderLookup && CFG.providersApiBase
              ? `<input id="inv-q" placeholder="Caută provider..."><div id="inv-sug" class="muted"></div>`
              : `<input id="inv-id" placeholder="provider_user_id">`
            }
            <select id="inv-role">
              <option value="PROVIDER">PROVIDER</option>
              <option value="GUEST">GUEST</option>
              <option value="STAFF">STAFF</option>
            </select>
            <button class="btn" id="btn-invite">Invită</button>
          </div>
        </div>`:''}

        ${sectionVisible('messages') ? `
        <div class="card">
          <h3>Mesaje</h3>
          <ul class="list">${msgs || '<li class="muted">Fără mesaje.</li>'}</ul>
          <div class="row" style="margin-top:8px; gap:8px;">
            <input id="msg-body" placeholder="Scrie un mesaj...">
            <button class="btn" id="btn-msg">Trimite</button>
          </div>
        </div>`:''}

        ${sectionVisible('attachments') ? `
        <div class="card">
          <h3>Atașamente</h3>
          <ul class="list">${atts || '<li class="muted">Fără atașamente.</li>'}</ul>
          <div class="row" style="margin-top:8px; gap:8px;">
            <input id="att-name" placeholder="contract.pdf">
            <input id="att-url" placeholder="https://...">
            <button class="btn" id="btn-attach">Adaugă</button>
          </div>
        </div>`:''}
      </div>
    `;
  }

  // ---------- Settings (Admin) ----------
  const isSettingsMode = (root.getAttribute('data-mode') || '').toLowerCase() === 'settings';
  function renderSettings(){
    const c = CFG;
    return `
      <h1>Config Modul: Events (Client)</h1>
      <div class="card">
        <div class="grid">
          <div><label>Events API Base</label><input id="c-apiBase" value="${escapeHtml(c.apiBase)}"></div>
          <div><label>Providers API Base</label><input id="c-provBase" value="${escapeHtml(c.providersApiBase)}" placeholder="opțional"></div>

          <div>
            <label>Auth strategy</label>
            <select id="c-auth-strategy">
              <option value="cookies" ${c.auth.strategy==='cookies'?'selected':''}>cookies</option>
              <option value="bearer" ${c.auth.strategy==='bearer'?'selected':''}>bearer</option>
            </select>
          </div>
          <div><label>Bearer var (JS)</label><input id="c-bearerVar" value="${escapeHtml(c.auth.bearerVar)}"></div>

          <div><label>Default currency</label><input id="c-currency" value="${escapeHtml(c.defaults.currency)}"></div>
          <div><label>Default location</label><input id="c-location" value="${escapeHtml(c.defaults.location)}"></div>
          <div><label>Default type</label>
            <select id="c-eventType">
              <option value="wedding" ${c.defaults.eventType==='wedding'?'selected':''}>wedding</option>
              <option value="baptism" ${c.defaults.eventType==='baptism'?'selected':''}>baptism</option>
              <option value="corporate" ${c.defaults.eventType==='corporate'?'selected':''}>corporate</option>
            </select>
          </div>
          <div><label>Locale</label><input id="c-locale" value="${escapeHtml(c.ui.locale)}"></div>
          <div><label>Timezone</label><input id="c-tz" value="${escapeHtml(c.defaults.timezone)}"></div>
          <div><label>Date Format (informativ)</label><input id="c-df" value="${escapeHtml(c.defaults.dateFormat)}"></div>

          <div><label>Status implicit</label>
            <select id="c-status">
              <option value="" ${c.filters.status===''?'selected':''}>Orice</option>
              ${['DRAFT','PLANNING','ACTIVE','COMPLETED','CANCELED'].map(s=>`<option ${c.filters.status===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div><label>Page size</label><input id="c-ps" type="number" value="${c.filters.pageSize}"></div>

          <div><label>Ascunde secțiuni</label>
            <select id="c-hide" multiple>
              ${['tasks','invitations','messages','attachments'].map(s=>`<option value="${s}" ${c.ui.hideSections.includes(s)?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Optimistic updates</label>
            <select id="c-opt">
              <option value="true" ${c.ui.optimisticUpdates?'selected':''}>true</option>
              <option value="false" ${!c.ui.optimisticUpdates?'selected':''}>false</option>
            </select>
          </div>
          <div>
            <label>Notifications</label>
            <select id="c-notif">
              <option value="false" ${!c.ui.notifications?'selected':''}>false</option>
              <option value="true" ${c.ui.notifications?'selected':''}>true</option>
            </select>
          </div>

          <div>
            <label>Provider lookup enable</label>
            <select id="c-prov-en">
              <option value="false" ${!c.integrations.enableProviderLookup?'selected':''}>false</option>
              <option value="true" ${c.integrations.enableProviderLookup?'selected':''}>true</option>
            </select>
          </div>
          <div><label>Provider min chars</label><input id="c-prov-min" type="number" value="${c.integrations.providerSearchMinChars}"></div>
          <div><label>Provider debounce (ms)</label><input id="c-prov-db" type="number" value="${c.integrations.providerSearchDebounceMs}"></div>
        </div>

        <div class="row" style="margin-top:12px; gap:12px;">
          <button class="btn" id="btn-cancel">Renunță</button>
          <button class="btn primary" id="btn-save">Salvează</button>
        </div>
      </div>
    `;
  }

  function escapeHtml(s){ return String(s??'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

  function collectSettings() {
    const get = id => document.getElementById(id);
    const multi = Array.from(get('c-hide').selectedOptions).map(o=>o.value);
    return deepMerge(DEFAULT_CONFIG, {
      apiBase: get('c-apiBase').value.trim(),
      providersApiBase: get('c-provBase').value.trim(),
      auth: {
        strategy: get('c-auth-strategy').value,
        bearerVar: get('c-bearerVar').value.trim()
      },
      defaults: {
        currency: get('c-currency').value.trim(),
        location: get('c-location').value.trim(),
        eventType: get('c-eventType').value,
        timezone: get('c-tz').value.trim(),
        dateFormat: get('c-df').value.trim()
      },
      filters: {
        status: get('c-status').value,
        pageSize: parseInt(get('c-ps').value,10)||20
      },
      ui: {
        hideSections: multi,
        optimisticUpdates: get('c-opt').value === 'true',
        notifications: get('c-notif').value === 'true',
        locale: get('c-locale').value.trim() || 'ro'
      },
      integrations: {
        enableProviderLookup: get('c-prov-en').value === 'true',
        providerSearchMinChars: parseInt(get('c-prov-min').value,10)||3,
        providerSearchDebounceMs: parseInt(get('c-prov-db').value,10)||350
      }
    });
  }

  function saveSettings(cfg){
    // Trimite la host (installer 02.2) — host va persista configul per modul în registry DB.
    window.parent?.postMessage({
      type: 'module-config-save',
      slug: 'events-client',
      payload: cfg
    }, '*');
    // Feedback simplu:
    alert('Config salvat (trimis către host).');
  }

  // ---------- Render root ----------
  function render(){
    const container = document.createElement('div');
    container.className = 'evc';
    let html = '';

    if (isSettingsMode) {
      html = renderSettings();
    } else {
      if (state.page === '/') html = renderList();
      else if (state.page === '/new') html = renderNewForm();
      else if (state.page.startsWith('/')) html = renderDetails();
      if (state.error) html = `<div class="card error"><strong>Eroare:</strong> ${state.error}</div>` + html;
    }

    container.innerHTML = html;
    root.replaceChildren(container);

    // Bindings comune
    const byId = (id) => container.querySelector('#'+id);

    if (isSettingsMode) {
      byId('btn-cancel')?.addEventListener('click', ()=>history.back());
      byId('btn-save')?.addEventListener('click', ()=>{
        const cfg = collectSettings();
        saveSettings(cfg);
      });
      return;
    }

    // Toolbar
    byId('btn-refresh')?.addEventListener('click', loadList);
    byId('btn-new')?.addEventListener('click', ()=> location.hash = '#/new');
    byId('flt-status')?.addEventListener('change', (e)=>{
      state.filters.status = e.target.value; loadList();
    });
    byId('flt-ps')?.addEventListener('change', (e)=>{
      state.meta.pageSize = parseInt(e.target.value,10)||20; loadList();
    });
    container.querySelectorAll('[data-ev-open]')?.forEach(btn=>{
      btn.addEventListener('click', ()=> location.hash = `#/${btn.getAttribute('data-ev-open')}`);
    });
    container.querySelectorAll('[data-ev-status]')?.forEach(sel=>{
      sel.addEventListener('change', (e)=> patchStatus(sel.getAttribute('data-ev-status'), e.target.value));
    });

    // New form
    byId('btn-cancel')?.addEventListener('click', ()=> history.back());
    byId('btn-save')?.addEventListener('click', ()=>{
      const payload = {
        name: byId('f-name').value.trim(),
        type: byId('f-type').value,
        description: byId('f-desc').value.trim() || undefined,
        startDate: new Date(byId('f-start').value || Date.now()).toISOString(),
        location: byId('f-location').value.trim() || undefined,
        currency: byId('f-currency').value.trim() || undefined
      };
      if (!payload.name || !payload.type) return alert('Completează Nume și Tip');
      createEvent(payload);
    });

    // Details
    byId('btn-back')?.addEventListener('click', ()=> location.hash = '#/');
    byId('ev-status')?.addEventListener('change', (e)=> patchStatus(state.current.id, e.target.value));

    byId('btn-add-task')?.addEventListener('click', ()=>{
      const e = state.current;
      const title = byId('t-title').value.trim();
      const due = byId('t-due').value ? new Date(byId('t-due').value).toISOString() : undefined;
      if (!title) return;
      addTask(e.id, { title, dueDate: due });
    });

    container.querySelectorAll('[data-task-done]')?.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const taskId = btn.getAttribute('data-task-done');
        updateTask(taskId, { status:'DONE' }, state.current.id);
      });
    });

    // Invite
    const btnInvite = byId('btn-invite');
    if (btnInvite) {
      if (CFG.integrations.enableProviderLookup && CFG.providersApiBase) {
        const qInput = byId('inv-q');
        const sug = byId('inv-sug');
        let selectedId = '';
        qInput.addEventListener('input', async ()=>{
          const list = await providerLookup(qInput.value.trim());
          sug.innerHTML = list.slice(0,5).map(x=>`<button class="btn" data-pick="${x.id}">${x.label}</button>`).join(' ') || '<span class="muted">—</span>';
          sug.querySelectorAll('[data-pick]').forEach(b=>{
            b.addEventListener('click', ()=>{ selectedId = b.getAttribute('data-pick'); qInput.value = b.textContent; sug.innerHTML=''; });
          });
        });
        btnInvite.addEventListener('click', ()=>{
          const role = byId('inv-role').value;
          if (!selectedId) return alert('Selectează un provider');
          inviteProvider(state.current.id, { invitedId: selectedId, role });
        });
      } else {
        btnInvite.addEventListener('click', ()=>{
          const id = byId('inv-id').value.trim();
          const role = byId('inv-role').value;
          if (!id) return;
          inviteProvider(state.current.id, { invitedId: id, role });
        });
      }
    }

    // Message
    byId('btn-msg')?.addEventListener('click', ()=>{
      const body = byId('msg-body').value.trim();
      if (!body) return;
      postMessage(state.current.id, body);
    });

    // Attachment
    byId('btn-attach')?.addEventListener('click', ()=>{
      const filename = byId('att-name').value.trim();
      const url = byId('att-url').value.trim();
      if (!filename || !url) return;
      addAttachment(state.current.id, { filename, url, mimeType: guessMime(filename), sizeBytes: 1 });
    });
  }

  // ---------- Router ----------
  window.addEventListener('hashchange', ()=>{
    if (isSettingsMode) return;
    const raw = location.hash.slice(1) || '/';
    state.page = raw;
    if (raw === '/') loadList();
    else if (raw === '/new') render();
    else if (raw.startsWith('/')) loadDetails(raw.slice(1));
  });

  function guessMime(name){ const ext=(name.split('.').pop()||'').toLowerCase(); const m={pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png'}; return m[ext]||'application/octet-stream'; }

  // ---------- Boot ----------
  (async ()=>{
    if (isSettingsMode) { render(); return; }
    if (state.page === '/') await loadList();
    else if (state.page.startsWith('/')) await loadDetails(state.page.slice(1));
    render();
  })();
})();
