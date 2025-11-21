class EventureModuleRoot extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  async connectedCallback() {
    const slug = this.getAttribute("data-slug");
    // află moduleId -> host API furnizează doar manifest; adăugăm o mică rută helper în UI:
    const metaRes = await fetch(`/api/modules/by-slug/${slug}`);
    if (!metaRes.ok) return this._renderError("Module not found");
    const meta = await metaRes.json();

    // config
    const cfgRes = await fetch(`/api/modules/${meta.id}/config`);
    const { config } = await cfgRes.json();
    const title = config?.title || "My Quotes";
    const allowAdd = !!config?.allowAdd;

    // lista quotes (KV)
    const kv = await fetch(`${process.env.NEXT_PUBLIC_MODULES_SERVICE_URL || ""}/modules/${meta.id}/kv`).then(r=>r.json()).catch(()=>({items:[]}));
    const items = kv.items?.filter(x=>x.k.startsWith("quote:")) || [];

    const root = document.createElement("div");
    root.innerHTML = `
      <style>
        .card{border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:8px 0}
        .row{display:flex;gap:8px;margin:12px 0}
        button{padding:6px 10px;border:1px solid #d1d5db;border-radius:8px;background:#f9fafb;cursor:pointer}
        input{flex:1;padding:6px 8px;border:1px solid #d1d5db;border-radius:8px}
      </style>
      <div class="card">
        <h3>${title}</h3>
        ${allowAdd ? `
          <div class="row">
            <input id="qtext" placeholder="Add a quote..." />
            <button id="addBtn">Add</button>
          </div>` : `<p>Adding new quotes is disabled by config.</p>`}
        <div id="list"></div>
      </div>
    `;
    this.shadowRoot.appendChild(root);

    const renderList = () => {
      const list = this.shadowRoot.getElementById("list");
      if (!items.length) { list.innerHTML = "<p>No quotes yet.</p>"; return; }
      list.innerHTML = items.map(it => `<div class="row">• ${it.v?.text||""}</div>`).join("");
    };
    renderList();

    if (allowAdd) {
      const addBtn = this.shadowRoot.getElementById("addBtn");
      addBtn.addEventListener("click", async () => {
        const q = this.shadowRoot.getElementById("qtext").value?.trim();
        if (!q) return;
        const k = `quote:${Date.now()}`;
        await fetch(`${(process.env.NEXT_PUBLIC_MODULES_SERVICE_URL||"")}/modules/${meta.id}/kv`, {
          method: "POST",
          headers: { "content-type":"application/json" },
          body: JSON.stringify({ k, v: { text: q } })
        });
        items.push({ k, v: { text: q } });
        this.shadowRoot.getElementById("qtext").value = "";
        renderList();
      });
    }
  }
  _renderError(msg){ this.shadowRoot.innerHTML = `<p style="color:#b91c1c">${msg}</p>`; }
}
if (!customElements.get("eventure-module-root")) {
  customElements.define("eventure-module-root", EventureModuleRoot);
}
