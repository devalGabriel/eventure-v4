class EventureModuleRoot extends HTMLElement {
  constructor(){ super(); this.attachShadow({ mode: "open" }); }
  async connectedCallback() {
    const slug = this.getAttribute("data-slug") || "people-client";
    const origin = new URL(".", import.meta.url).origin;

    // whoami – adaptează la auth real; fallback demo
    let userId = null;
    try { const me = await fetch("/api/whoami", { cache: "no-store" }).then(r=>r.json()); userId = me?.id || null; } catch {}
    if (!userId) userId = "demo-user";

    const root = document.createElement("div");
    root.innerHTML = `
      <style>
        .card{border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:8px 0;font:14px/1.4 ui-sans-serif,system-ui}
        .row{display:flex;gap:8px;margin:12px 0}
        input{flex:1;padding:8px;border:1px solid #d1d5db;border-radius:8px}
        button{padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;background:#f9fafb;cursor:pointer}
        ul{margin:0;padding-left:18px}
        .muted{color:#6b7280}
      </style>
      <div class="card">
        <h3 style="margin:0">People — My names</h3>
        <p class="muted" style="margin:6px 0 0 0">Only your own entries are visible.</p>
        <div class="row">
          <input id="nameInput" placeholder="Type a name…" />
          <button id="addBtn">Add</button>
        </div>
        <div id="list" class="muted">Loading…</div>
      </div>
    `;
    this.shadowRoot.appendChild(root);

    const listEl = this.shadowRoot.getElementById("list");

    const load = async () => {
      const res = await fetch(`${origin}/mod/${slug}/names?user=${encodeURIComponent(userId)}`, { cache:"no-store" });
      const data = await res.json();
      const items = data.items || [];
      if (!items.length) { listEl.innerHTML = "<p class='muted'>No names yet.</p>"; return; }
      listEl.innerHTML = `<ul>${items.map(i=>`<li>${escapeHtml(i.nume)}</li>`).join("")}</ul>`;
    };

    this.shadowRoot.getElementById("addBtn").addEventListener("click", async () => {
      const inp = this.shadowRoot.getElementById("nameInput");
      const nume = (inp.value || "").trim();
      if (!nume) return;
      await fetch(`${origin}/mod/${slug}/names`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nume, user: userId })
      });
      inp.value = "";
      await load();
    });

    await load();
  }
}
function escapeHtml(s){ return s.replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
if (!customElements.get("eventure-module-root")) {
  customElements.define("eventure-module-root", EventureModuleRoot);
}
