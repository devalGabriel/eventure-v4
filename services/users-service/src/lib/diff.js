function diffKeys(before, after, allowedKeys) {
  const changed = [];
  for (const k of allowedKeys) {
    const b = before?.[k];
    const a = after?.[k];
    const same = JSON.stringify(b) === JSON.stringify(a);
    if (!same) changed.push(k);
  }
  return changed;
}
module.exports = { diffKeys };
