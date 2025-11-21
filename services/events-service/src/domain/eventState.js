export const Allowed = Object.freeze({
  DRAFT:     ['PLANNING','CANCELED'],
  PLANNING:  ['ACTIVE','CANCELED'],
  ACTIVE:    ['COMPLETED','CANCELED'],
  COMPLETED: [],
  CANCELED:  []
});

export function canTransition(from, to) {
  return (Allowed[from] || []).includes(to);
}

export function getAllowedTransitions(from) {
  return Allowed[from] || [];
}