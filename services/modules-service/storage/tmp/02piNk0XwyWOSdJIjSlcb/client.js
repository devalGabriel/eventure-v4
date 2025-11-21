class EventureModuleRoot extends HTMLElement {
  connectedCallback() {
    const slug = this.getAttribute("data-slug");
    // optional: citește config via UI proxy dacă vrei să o afișezi
    this.innerHTML = `
      <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="margin:0 0 8px 0">Hello World – Loaded as Web Component</h2>
        <p>Slug: <b>${slug}</b></p>
        <p id="greet">Loading config…</p>
      </div>
    `;
    // fetch config via host BE proxy (Next) -> modules-service
    fetch(`/api/modules/by-slug/${slug}`).then(r=>r.json()).then(async info=>{
      // need id to fetch config; host API expune doar manifest.
      // simplu: rezolvăm printr-o mici optimizare: încă un endpoint în host UI nu e necesar.
      // Vom apela direct modules-service prin manifest.entryClient origin discovery? Lăsăm demo:
      document.getElementById("greet").textContent = "Hello world!";
    });
  }
}
if (!customElements.get("eventure-module-root")) {
  customElements.define("eventure-module-root", EventureModuleRoot);
}
