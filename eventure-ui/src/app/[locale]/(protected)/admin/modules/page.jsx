"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const api = {
  list: () => fetch("/api/modules").then(r=>r.json()),
  install: (file) => { const fd=new FormData(); fd.append("file", file); return fetch("/api/modules/install",{method:"POST",body:fd}).then(r=>r.json()); },
  enable: (slug) => fetch(`/api/modules/slug/${slug}/enable`, { method: "POST" }).then(r=>r.json()),
  disable: (slug) => fetch(`/api/modules/slug/${slug}/disable`, { method: "POST" }).then(r=>r.json()),
  remove: (slug) => fetch(`/api/modules/slug/${slug}`, { method: "DELETE" }).then(r=>r.json()),
  getConfig: (slug) => fetch(`/api/modules/slug/${slug}/config`).then(r=>r.json()),
  saveConfig: (slug, cfg) => fetch(`/api/modules/slug/${slug}/config`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg)
  }).then(r=>r.json()),
};

export default function AdminModulesPage() {
  const { locale } = useParams();
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const [cfgTarget, setCfgTarget] = useState(null);
  const [cfg, setCfg] = useState({});
  const [cfgSchema, setCfgSchema] = useState(null);

  const refresh = async () => {
    const data = await api.list();
    setItems(data.modules || []);
  };
  useEffect(() => { refresh(); }, []);

  const doInstall = async () => {
    if (!file) return;
    setBusy(true);
    try { await api.install(file); await refresh(); setFile(null); }
    finally { setBusy(false); }
  };

  const openConfig = async (m) => {
    const res = await api.getConfig(m.slug);
    setCfgTarget(m);
    setCfg(res?.config || {});
    setCfgSchema(res?.schema || null);
  };

  const saveConfig = async () => {
    if (!cfgTarget) return;
    setBusy(true);
    try { await api.saveConfig(cfgTarget.slug, cfg); await refresh(); setCfgTarget(null); }
    finally { setBusy(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Modules</h1>
        <div className="flex items-center gap-3">
          <input type="file" accept=".zip" onChange={e=>setFile(e.target.files?.[0]||null)} />
          <button disabled={!file||busy} onClick={doInstall} className="btn btn-primary">
            {busy ? "Installing..." : "Install .zip"}
          </button>
        </div>
      </header>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-2 text-left">Name</th>
            <th className="p-2">Slug</th>
            <th className="p-2">Version</th>
            <th className="p-2">Enabled</th>
            <th className="p-2">Type</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(m=>(
            <tr key={m.slug} className="border-t">
              <td className="p-2 text-left">{m.name}</td>
              <td className="p-2">{m.slug}</td>
              <td className="p-2">{m.version}</td>
              <td className="p-2">{m.enabled ? "Yes" : "No"}</td>
              <td className="p-2">{m.type}</td>
              <td className="p-2 flex gap-2 justify-center">
                {m.enabled
                  ? <button onClick={()=>api.disable(m.slug).then(refresh)} className="btn btn-secondary">Disable</button>
                  : <button onClick={()=>api.enable(m.slug).then(refresh)} className="btn btn-primary">Enable</button>}
                <button onClick={()=>openConfig(m)} className="btn">Config</button>
                <button onClick={()=>api.remove(m.slug).then(refresh)} className="btn btn-danger">Delete</button>
<a className="btn" href={`/${locale}/admin/modules/host/${m.slug}`} target="_blank" rel="noreferrer">Open</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {cfgTarget && (
        <div className="fixed inset-0 bg-black/40 flex">
          <div className="ml-auto w-full max-w-xl bg-white p-6 space-y-4">
            <h2 className="text-xl font-semibold">Config: {cfgTarget.name}</h2>
            {cfgSchema?.properties ? Object.entries(cfgSchema.properties).map(([key, def])=>{
              const type = def.type;
              return (
                <div key={key} className="flex items-center justify-between gap-3">
                  <label className="w-1/2">{def.title||key}</label>
                  {type==="boolean" ? (
                    <input type="checkbox" checked={!!cfg[key]} onChange={e=>setCfg(v=>({...v,[key]:e.target.checked}))}/>
                  ) : type==="number" ? (
                    <input className="input" type="number" value={cfg[key] ?? ""} onChange={e=>setCfg(v=>({...v,[key]:Number(e.target.value)}))}/>
                  ) : (
                    <input className="input" type="text" value={cfg[key] ?? ""} onChange={e=>setCfg(v=>({...v,[key]:e.target.value}))}/>
                  )}
                </div>
              );
            }) : <p>No schema provided.</p>}
            <div className="flex gap-3">
              <button className="btn btn-primary" onClick={saveConfig} disabled={busy}>Save</button>
              <button className="btn" onClick={()=>setCfgTarget(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
