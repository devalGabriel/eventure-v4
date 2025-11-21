// Safe NATS publish helper – nu aruncă dacă lipsesc subject/payload
export function safePublish(nats, subject, payload = {}) {
  try {
    if (!nats || !subject) return false;
    const dataStr = JSON.stringify(payload ?? {});
    const buf = Buffer.from(dataStr, 'utf8');
    nats.publish(subject, buf);
    return true;
  } catch (e) {
    console.warn('⚠️ Failed to publish', subject, e?.message || e);
    return false;
  }
}
