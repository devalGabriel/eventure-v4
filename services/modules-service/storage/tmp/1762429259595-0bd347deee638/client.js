// events-client v1.1.1 (with logging & self-checks)
(() => {
  const SLUG = 'events-client';
  const VERSION = '1.1.1';

  // ---- Logger (console + postMessage spre host) ----
  function postToHost(type, payload) {
    try { window.parent?.postMessage({ type, slug: SLUG, version: VERSION, ...payload }, '*'); } catch {}
  }
  function log(level, msg, extra) {
    const stamp = `[${SLUG}@${VERSION}]`;
    try {
      if (level === 'error') console.error(stamp, msg, extra ?? '');
      else if (level === 'warn') console.warn(stamp, msg, extra ?? '');
      else console.log(stamp, msg, extra ?? '');
    } catch {}
    postToHost('module-log', { level, message: msg, extra });
  }

  // Small util for safe JSON attr parsing
  function parseJsonAttr(el, name) {
    const raw = el.getAttribute(name);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch (e) { log('error', `Failed to parse ${name}`, { raw, err: String(e) }); return null; }
  }

  function deepMerge(base, extra) {
    if (!extra || typeof extra !== 'object') return structuredClone(base);
    const out = structuredClone(base);
    (function assign(d, s) {
      for (const k of Object.keys(s)) {
        const v = s[k];
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          if (!d[k] || typeof d[k] !== 'object') d[k] = {};
          assign(d[k], v);
        } else { d[k] = v; }
      }
    })(out, extra);
    return out;
  }

  // ---- Boot checks ----
  const root = document.getElementById('module-root');
  if (!root) {
    log('error', 'Missing #module-root. Abort.');
    return;
  }
  postToHost('module-handshake', { ok: true });

  // ---- Default config ----
  const DEFAULT_CONFIG = {
    apiBase: root.getAttribute('data-api') || 'http://localhost:4003',
    auth: { strategy: 'cookies', bearerVar: 'window.__AUTH_TOKEN__' },
    filters: { status: '', pageSize: 20 },
    ui: { hideSections: [], optimisticUpdates: true, notifications: false, locale: 'ro' }
  };

  // Load config from data-config or window.__MODULE_CONFIG__
  const cfgFromAttr = parseJsonAttr(root, 'data-config');
  // eslint-disable-next-line no-underscore-dangle
  const cfgFromGlobal = (window.__MODULE_CONFIG__ && window.__MODULE_CONFIG__[SLUG]) || null;

  const CFG = deepMerge(DEFAULT_CONFIG, cfgFromAttr || cfgFromGlobal || {});
  const LOCALE = CFG.ui?.locale || (document.documentElement.lang || 'ro');

  log('log', 'Boot with config', CFG);

  // ---- Basic styles (inline allowed by compat.csp) ----
  injectStyles(`
    .evc { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 16px; }
    .evc h1 { font-size: 20px; margin: 0 0 12px; }
    .evc .row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .evc .card { border:1px solid #e5e7eb; border-radius:12px; padding:12px; margin:8px 0; background:#fff; }
    .evc .btn { padding:8px 12px; border:1px solid #e5e7eb; border-radius:8px; cursor:pointer; background:#fff; }
    .evc .btn.primary { background:#111827; color:#fff; border-color:#111827; }
    .evc input, .evc select, .evc textarea { padding:8px; border:1px solid #e5e7eb; border-radius:8px; }
    .evc .muted { color:#6b7280; font-size:12px; }
    .evc .kvs { display:flex; gap:8px; flex-wrap:wrap; font-size:12px; color:#374151; }
    .evc .pill { padding:4px 8px; border-radius:999px; border:1px solid #e5e7eb; background:#f9fafb; }
    .evc .list { margin:0; padding:0; list-style:none; }
    .evc .list li { padding:8px 0; border-bottom:1px dashed #e5e7eb; }
    .evc .toolbar { display:flex; gap:8px; flex-wrap:wrap; justify-content:space-between; }
    .evc .grow { flex:1 1 auto; min-width:220px; }
    .evc .error { border-color:#ef4444;color:#991b1b;background:#fff1f2 }
    .evc .badge { font-size:11px; padding:2px 6px; border-radius:6px; background:#eef2ff; border:1px solid #e5e7eb }
  `);

  function injectStyles(css) {
    try {
      const s = document.createElement('style');
      s.textContent = css;
      document.head.appendChild(s);
    } catch (e) { log('warn', 'Failed to inject styles', { err: String(e) }); }
  }

  // ---- API helper (cu log-uri) ----
  async function apiFetch(path, opts = {}) {
    const url = `${CFG.apiBase}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (CFG.auth.strategy === 'bearer') {
      try {
        const token = eval(CFG.auth.bearerVar);
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch (e) { log('warn', 'Bearer var eval failed', { err: String(e) }); }
    }
    const reqInit = {
      method: opts.method || 'GET',
      headers,
      credentials: CFG.auth.strategy === 'cookies' ? 'include' : 'omit',
      body: opts.body ? JSON.stringify(opts.body) : undefined
    };
    log('log', 'apiFetch →', { url, reqInit });
    const res = await fetch(url, reqInit);
    const ct = res.headers.get('content-type') || '';
    let payload = null;
    try { payload = ct.includes('application/json') ? await res.json() : await res.text(); }
    catch (e) { log('warn', 'apiFetch payload parse failed', { err: String(e) }); }
    if (!res.ok) {
      log('error', `apiFetch ${res.status} ${res.statusText}`, { url, payload });
      throw new Error((payload && payload.error) || res.statusText || `HTTP ${res.status}`);
    }
    log('log', 'apiFetch OK', { url, payload });
    return payload;
  }

  // ---- Self-checks: root + config + ping backend ----
  (async () => {
    try {
      // 1) root OK? (deja verificat)
      // 2) config sanity
      if (typeof CFG.apiBase !== 'string' || !CFG.apiBase.startsWith('http')) {
        log('warn', 'Suspicious apiBase', { apiBase: CFG.apiBase });
      }
      // 3) health check (nu fatal)
      try {
        const health = await fetch(`${CFG.apiBase}/health`, { credentials: CFG.auth.strategy === 'cookies' ? 'include' : 'omit' });
        log('log', 'health check', { ok: health.ok, status: health.status });
      } catch (e) {
        log('warn', 'health check failed', { err: String(e), apiBase: CFG.apiBase });
      }
    } catch (e) {
      log('error', 'Self-checks crashed', { err: String(e) });
    }
  })();

  // ---- State ----
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

  // ---- Utils ----
  const pill = (v) => `<span class="pill">${v}</span>`;
  function fmtDate(d) { try { return new Date(d).toLocaleString(LOCALE); } catch { return d; } }
  function qs(o){ return Object.entries(o).filter(([,v])=>v!==''&&v!=null).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'); }
  function escapeHtml(s){ return String(s??'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

  // ---- Data loaders (cu log-uri + try/catch) ----
  async function loadList() {
    setState({ loading: true, error: '' });
    try {
      const q = { page: state.meta.page, pageSize: state.meta.pageSize, status: state.filters.status };
      const data = await apiFetch(`/events?${qs(q)}`);
      setState({ events: data.items || [], meta: { total: data.total || 0, page: data.page || 1, pageSize: data.pageSize || state.meta.pageSize } });
    } catch (e) {
      setState({ error: e.message });
    } finally { setState({ loading: false }); }
  }

  async function loadDetails(id) {
    setState({ loading: true, error: '', current: null });
    try {
      const data = await apiFetch(`/events/${id}`);
      setState({ current: data });
    } catch (e) {
      setState({ error: e.message });
    } finally { setState({ loading: false }); }
  }

  async function patchStatus(id, status) {
    try {
      const updated = await apiFetch(`/events/${id}`, { method: 'PUT', body: { status } });
      if (CFG.ui.optimisticUpdates) {
        if (state.current?.id === id) state.current.status = updated.status;
        const i = state.events.findIndex(e => e.id === id); if (i > -1) state.events[i].status = updated.status;
        render();
      } else { await Promise.all([loadDetails(id), loadList()]); }
    } catch (e) { alert(e.message); }
  }

  async function createEvent(payload) {
    setState({ loading: true });
    try {
      const e = await apiFetch('/events', { method: 'POST', body: payload });
      location.hash = `#/${e.id}`;
    } catch (e) { alert(`Eroare: ${e.message}`); }
    finally { setState({ loading: false }); }
  }

  // ---- Views (minime pentru test rapid) ----
  function renderToolbar(){
    return `
      <div class="toolbar card">
        <div class="row grow">
          <input class="grow" id="flt-q" placeholder="Căutare locală (nume/locație)">
          <select id="flt-status">
            <option value="">Orice status</option>
            <option>DRAFT</option><option>PLANNING</option><option>ACTIVE</option><option>COMPLETED</option><option>CANCELED</option>
          </select>
          <select id="flt-ps">
            ${[10,20,50,100].map(s=>`<option value="${s}" ${s===state.meta.pageSize?'selected':''}>${s}/pag</option>`).join('')}
          </select>
        </div>
        <div class="row">
          <span class="badge">API: ${escapeHtml(CFG.apiBase)}</span>
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
            <div class="kvs">${pill(e.type)}${pill(e.status)}${pill(e.currency)}</div>
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
        <div class="row" style="gap:12px;">
          <input id="f-name" placeholder="Ex: Nunta Maria & Andrei" style="min-width:260px;">
          <select id="f-type"><option>wedding</option><option>baptism</option><option>corporate</option></select>
          <input id="f-start" type="datetime-local">
          <input id="f-location" placeholder="București" value="${escapeHtml(CFG.ui?.defaults?.location || '')}">
          <input id="f-currency" value="${escapeHtml(CFG.ui?.defaults?.currency || 'RON')}">
          <button class="btn primary" id="btn-save">Creează</button>
          <button class="btn" id="btn-cancel">Renunță</button>
        </div>
      </div>
    `;
  }

  function renderDetails(){
    const e = state.current;
    if (!e) return `<div class="muted">Se încarcă...</div>`;

    const tasks = (e.tasks||[]).map(t=>`
      <li class="row" style="justify-content:space-between;">
        <div><strong>${t.title}</strong><div class="muted">${t.status}${t.dueDate? ' · '+fmtDate(t.dueDate):''}</div></div>
        <div class="row">${t.status!=='DONE'? `<button class="btn" data-task-done="${t.id}">DONE</button>`:''}</div>
      </li>
    `).join('');

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

      <div class="card">
        <h3>Taskuri</h3>
        <ul class="list">${tasks || '<li class="muted">Niciun task.</li>'}</ul>
      </div>
    `;
  }

  // ---- Render & binds ----
  function render() {
    try {
      const container = document.createElement('div');
      container.className = 'evc';
      let html = '';
      if (state.page === '/') html = renderList();
      else if (state.page === '/new') html = renderNewForm();
      else if (state.page.startsWith('/')) html = renderDetails();
      if (state.error) html = `<div class="card error"><strong>Eroare:</strong> ${escapeHtml(state.error)}</div>` + html;
      container.innerHTML = html;
      root.replaceChildren(container);

      const byId = (id) => container.querySelector('#'+id);

      // toolbar
      byId('btn-refresh')?.addEventListener('click', loadList);
      byId('btn-new')?.addEventListener('click', ()=> location.hash = '#/new');
      byId('flt-status')?.addEventListener('change', e => { state.filters.status = e.target.value; loadList(); });
      byId('flt-ps')?.addEventListener('change', e => { state.meta.pageSize = parseInt(e.target.value,10)||20; loadList(); });
      container.querySelectorAll('[data-ev-open]')?.forEach(b => b.addEventListener('click', ()=> location.hash = `#/${b.getAttribute('data-ev-open')}`));
      container.querySelectorAll('[data-ev-status]')?.forEach(sel => sel.addEventListener('change', e => patchStatus(sel.getAttribute('data-ev-status'), e.target.value)));

      // new form
      byId('btn-cancel')?.addEventListener('click', ()=> history.back());
      byId('btn-save')?.addEventListener('click', ()=>{
        const payload = {
          name: byId('f-name').value.trim(),
          type: byId('f-type').value,
          startDate: new Date(byId('f-start').value || Date.now()).toISOString(),
          location: byId('f-location').value.trim() || undefined,
          currency: byId('f-currency').value.trim() || 'RON'
        };
        if (!payload.name || !payload.type) return alert('Completează Nume și Tip');
        log('log', 'createEvent payload', payload);
        createEvent(payload);
      });

      // details
      byId('btn-back')?.addEventListener('click', ()=> { location.hash = '#/'; });
      byId('ev-status')?.addEventListener('change', e => patchStatus(state.current.id, e.target.value));
      container.querySelectorAll('[data-task-done]')?.forEach(b=>{
        b.addEventListener('click', ()=> {
          // aici doar exemplificăm log-ul – în modul complet s-ar apela PUT /tasks/:id
          log('log', 'mark task DONE (demo)', { id: b.getAttribute('data-task-done') });
        });
      });
    } catch (e) {
      log('error', 'Render crashed', { err: String(e) });
    }
  }

  // ---- Router ----
  window.addEventListener('hashchange', ()=>{
    const raw = location.hash.slice(1) || '/';
    state.page = raw;
    if (raw === '/') loadList();
    else if (raw === '/new') render();
    else if (raw.startsWith('/')) loadDetails(raw.slice(1));
  });

  // ---- Boot ----
  (async ()=>{
    try {
      log('log', 'Boot start');
      if (state.page === '/') await loadList();
      else if (state.page.startsWith('/')) await loadDetails(state.page.slice(1));
      render();
      log('log', 'Boot done');
    } catch (e) {
      log('error', 'Boot failed', { err: String(e) });
    }
  })();
})();
