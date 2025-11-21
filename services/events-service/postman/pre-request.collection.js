// Build HS256 JWT in Postman using environment vars
// Requires: jwtAlg=HS256, jwtSecret, userId, role, email
function b64url(input) {
  return CryptoJS.enc.Base64.stringify(input)
    .replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
}

const alg = pm.environment.get('jwtAlg') || 'HS256';
if (alg !== 'HS256') {
  throw new Error('This pre-request script supports HS256 only. For RS256 use service-side signing.');
}
const secret = pm.environment.get('jwtSecret');
const sub = pm.environment.get('userId') || 'u_dev_123';
const role = pm.environment.get('role') || 'client';
const email = pm.environment.get('email') || 'dev@example.com';
const iat = Math.floor(Date.now() / 1000);
const exp = iat + 3600; // 1h

const header = { alg: "HS256", typ: "JWT" };
const payload = { sub, role, email, iat, exp };

const hStr = b64url(CryptoJS.enc.Utf8.parse(JSON.stringify(header)));
const pStr = b64url(CryptoJS.enc.Utf8.parse(JSON.stringify(payload)));
const toSign = `${hStr}.${pStr}`;

const signature = CryptoJS.HmacSHA256(toSign, secret);
const sStr = b64url(signature);

const token = `${toSign}.${sStr}`;
pm.environment.set('token', token);
