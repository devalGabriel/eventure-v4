export function getNeedLabel(needId, needs) {
  const n = needs?.find?.((n) => n.id === needId);
  return n ? n.label : "Nevoie";
}