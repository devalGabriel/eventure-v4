// src/lib/flags.js
const flags = {
  // activează/dezactivează rapid funcționalități
  MARKETPLACE: process.env.NEXT_PUBLIC_FLAG_MARKETPLACE === '1',
  ANALYTICS: process.env.NEXT_PUBLIC_FLAG_ANALYTICS === '1',
  AI_SUGGESTIONS: process.env.NEXT_PUBLIC_FLAG_AI_SUGGESTIONS === '1',
  PUBLIC_EVENTS: process.env.NEXT_PUBLIC_FLAG_PUBLIC_EVENTS === '1'
};

export function getFlag(key){ return !!flags[key]; }
export function getAllFlags(){ return {...flags}; }
