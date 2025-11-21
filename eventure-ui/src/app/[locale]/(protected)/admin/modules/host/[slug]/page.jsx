"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MODULES_SERVICE_URL } from "@/lib/services";

export default function ModuleHostAdminPage() {
  const { slug } = useParams();
  const [mod, setMod] = useState(null);
  const [err, setErr] = useState(null);

useEffect(() => {
  (async () => {
    try {
      const res = await fetch(`/api/modules/by-slug/${slug}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Module not found");
      const data = await res.json();
      setMod(data);

      const entry = data?.manifest?.entryClient;
      if (entry) {
        // dacă manifestul are /packages/... îl trecem prin proxy-ul nostru
        const proxied = entry.startsWith("/packages/")
          ? `/api/modules/assets${entry}`     // same-origin -> OK cu CSP existent
          : entry;
        await import(/* webpackIgnore: true */ proxied);
      }
    } catch (e) { setErr(String(e)); }
  })();
}, [slug]);

  if (err) return <div className="p-6 text-red-600">Error: {String(err)}</div>;
  if (!mod) return <div className="p-6">Loading module…</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">{mod.manifest?.name} v{mod.manifest?.version}</h1>
      <eventure-module-root data-slug={slug} data-host="admin"></eventure-module-root>
    </div>
  );
}
