export function stripGroups(path) {
  return path.replace(/\/\([^/]+?\)(?=\/|$)/g, '');
}