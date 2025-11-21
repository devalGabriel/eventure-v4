// src/lib/notif-bus.js
import { EventEmitter } from 'events';

export function getGlobalBus() {
  const g = globalThis;
  if (!g.__evt_notif_bus) {
    g.__evt_notif_bus = new EventEmitter();
    g.__evt_notif_bus.setMaxListeners(100);
  }
  return g.__evt_notif_bus;
}