#!/usr/bin/env node
/** Eventure – Services local manager (CommonJS)
 * Rulat DIN: services/ (nu afectează root-ul Next.js).
 * Comenzi: start/stop/restart/status/logs/kill/ps/health/env-check
 */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const http = require('http');

const SERVICES_ROOT = path.resolve(__dirname, '..');       // <repo>/services
const PIDS_DIR = path.join(SERVICES_ROOT, '.pids');
const LOGS_DIR = path.join(SERVICES_ROOT, '.logs');

ensureDir(PIDS_DIR); ensureDir(LOGS_DIR);
function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

function listServices() {
  return fs.readdirSync(SERVICES_ROOT)
    .filter(n => fs.existsSync(path.join(SERVICES_ROOT, n, 'package.json')))
    .sort();
}
const ALL = listServices();

function svcPath(s) { return path.join(SERVICES_ROOT, s); }
function logFile(s) { return path.join(LOGS_DIR, `${s}.log`); }
function pkgOf(s) {
  try { return JSON.parse(fs.readFileSync(path.join(svcPath(s), 'package.json'), 'utf8')); }
  catch { return null; }
}

// --- PM2 detect (opțional) ---
function hasPm2() {
  try { return spawnSync(process.platform === 'win32' ? 'pm2.cmd' : 'pm2', ['-v'], { stdio: 'ignore' }).status === 0; }
  catch { return false; }
}
const PM2 = hasPm2();

// --- PIDs (Native mode) ---
function pidFile(s) { return path.join(PIDS_DIR, `${s}.pid`); }
function writePid(s, p) { fs.writeFileSync(pidFile(s), String(p)); }
function readPid(s) { try { return parseInt(fs.readFileSync(pidFile(s), 'utf8')); } catch { return null; } }
function clearPid(s) { try { fs.unlinkSync(pidFile(s)); } catch { } }
function alive(pid) { try { process.kill(pid, 0); return true; } catch { return false; } }

// --- helpers ---
function parseEnv(file) {
  if (!fs.existsSync(file)) return {};
  const out = {}; for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/); if (!m) continue;
    let v = m[2]; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  } return out;
}
function getPort(s) {
  const base = svcPath(s);
  for (const f of ['.env', '.env.local', '.env.development']) {
    const env = parseEnv(path.join(base, f));
    if (env.PORT && /^\d+$/.test(env.PORT)) return Number(env.PORT);
  }
  const pkg = pkgOf(s);
  if (pkg?.config?.port && /^\d+$/.test(String(pkg.config.port))) return Number(pkg.config.port);
  // fallback rapid (poți personaliza)
  const n = s.toLowerCase(); if (n.includes('auth')) return 4001; if (n.includes('users')) return 4002;if (n.includes('providers')) return 4004; if (n.includes('events')) return 4003; if (n.includes('tasks')) return 4004;
  return null;
}

function probe(port, timeout = 700) {
  const hosts = ['127.0.0.1', '::1', 'localhost'];
  return Promise.race(
    hosts.map(h => new Promise((resolve) => {
      const sock = new net.Socket();
      let done = false;
      const end = (ok) => { if (done) return; done = true; try { sock.destroy(); } catch { }; resolve(ok); };
      sock.setTimeout(timeout);
      sock.once('connect', () => end(true));
      sock.once('timeout', () => end(false));
      sock.once('error', () => end(false));
      sock.connect(port, h);
    }))
  );
}

function pidByPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = spawnSync('cmd.exe', ['/d', '/s', '/c', `netstat -ano | findstr :${port}`], { encoding: 'utf8' }).stdout || '';
      const l = out.split('\n').map(x => x.trim()).find(x => x && /LISTENING/.test(x)); if (!l) return null;
      const pid = l.split(/\s+/).slice(-1)[0]; return /^\d+$/.test(pid) ? Number(pid) : null;
    } else {
      const out = spawnSync('bash', ['-lc', `lsof -nP -iTCP:${port} -sTCP:LISTEN -Fp`], { encoding: 'utf8' }).stdout || '';
      const m = out.match(/p(\d+)/); return m ? Number(m[1]) : null;
    }
  } catch { return null; }
}

// --- runners ---
function spawnNodeDetached(cwd, nodeArgs, logPath) {
  // nodeArgs: array, ex: ['src/index.js']
  const out = logPath ? fs.openSync(logPath, 'a') : 'ignore';
  const err = logPath ? out : 'ignore';
  const child = spawn(process.execPath, nodeArgs, {
    cwd,
    detached: true,
    stdio: ['ignore', out, err],
  });
  child.unref();
  return child;
}
function npmRunDetached(cwd, script, { logFile } = {}) {
  // fallback vechi (folosit doar dacă nu putem porni direct Node)
  const isWin = process.platform === 'win32';
  const sh = isWin ? 'cmd.exe' : 'bash';
  const flag = isWin ? '/d /s /c' : '-lc';
  const redir = ''; // nu folosim redirecționare în shell; avem fallback minimal
  const cmd = `npm run ${script} ${redir}`;
  const child = spawn(sh, [flag, cmd], { cwd, detached: true, stdio: 'ignore' });
  child.unref();
  return child;
}

// --- PM2 commands ---
function pm2(cmd, args, opts = {}) { return spawn(process.platform === 'win32' ? 'pm2.cmd' : 'pm2', [cmd, ...args], { stdio: 'inherit', ...opts }); }
const pm2Start = (s) => pm2('start', ['npm', '--name', s, '--', 'run', 'start'], { cwd: svcPath(s) });
const pm2Stop = (s) => pm2('stop', [s]);
const pm2Restart = (s) => pm2('restart', [s]);
const pm2Delete = (s) => pm2('delete', [s]);
const pm2Status = () => pm2('status', []);
const pm2Logs = (s) => pm2('logs', s ? [s, '--lines', '200'] : ['--lines', '200']);

// --- Native commands ---
function startNative(service) {
  const pkg = pkgOf(service);
  if (!pkg) { console.error(`❌ lipsă package.json: ${service}`); return; }

  // alegem "start:logged" dacă există, altfel "start"
  const scriptName = pkg.scripts?.['start:logged'] ? 'start:logged' : 'start';
  const script = pkg.scripts?.[scriptName];
  if (!script) { console.error(`❌ lipsă script "${scriptName}" în ${service}/package.json`); return; }

  const logPath = pkg.scripts?.['start:logged'] ? logFile(service) : null;

  // dacă scriptul e de forma "node <cale> [args...]" -> pornim direct node
  const m = script.match(/^\s*node\s+(.+)$/i);
  if (m) {
    // spargem argumentele simplu; dacă ai spații cu ghilimele, păstrează-le
    const raw = m[1].trim();
    // split simplu pe spații (merge pentru cazurile noastre "node src/index.js")
    const nodeArgs = raw.match(/(?:[^\s"]+|"[^"]*")+/g).map(s => s.replace(/^"(.*)"$/, '$1'));
    const child = spawnNodeDetached(svcPath(service), nodeArgs, logPath);
    writePid(service, child.pid);
    console.log(`▶️  ${service} pornit (pid=${child.pid})`);
    return;
  }

  // altfel -> fallback prin npm (mai rar pe proiectul nostru)
  const child = npmRunDetached(svcPath(service), scriptName, { logFile: logPath });
  writePid(service, child.pid); // va fi PID-ul shell-ului; preferăm varianta directă
  console.log(`▶️  ${service} pornit (pid=${child.pid})`);
}
function stopNative(s) {
  const pid = readPid(s); if (!pid) { console.log(`ℹ️  ${s}: fără PID`); return; }
  if (!alive(pid)) { console.log(`ℹ️  ${s}: proces inexistent (pid=${pid})`); clearPid(s); return; }
  console.log(`⏹️  opresc ${s} (pid=${pid})`);
  try {
    process.kill(pid, 'SIGTERM');
    setTimeout(() => {
      if (alive(pid)) {
        console.log('⚠️  forțez kill');
        if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
        else try { process.kill(pid, 'SIGKILL'); } catch { }
      }
      if (!alive(pid)) { console.log(`✅ oprit ${s}`); clearPid(s); } else { console.log(`❌ nu s-a putut`); }
    }, 1200);
  } catch (e) { console.log(`❌ ${s}: ${e.message}`); }
}
function restartNative(s) { stopNative(s); setTimeout(() => startNative(s), 1800); }
function statusNative() {
  const rows = ALL.map(s => { const pid = readPid(s); return { service: s, pid: pid || '-', status: (pid && alive(pid)) ? 'online' : 'stopped' }; });
  table(rows, ['service', 'pid', 'status']);
}
function logsNative(s) {
  const lf = logFile(s);
  if (!fs.existsSync(lf)) {
    console.log(`ℹ️  nu există log pentru ${s} la ${lf}
Sugestie: în ${s}/package.json:
  "start:logged": "node src/index.js >> ../.logs/${s}.log 2>&1"
`);
    return;
  }
  const start = Math.max(fs.statSync(lf).size - 64 * 1024, 0);
  fs.createReadStream(lf, { start, encoding: 'utf8' }).pipe(process.stdout);
  fs.watch(lf, { persistent: true }, () => {
    const s = fs.createReadStream(lf, { start: fs.statSync(lf).size - 1, encoding: 'utf8' });
    s.pipe(process.stdout, { end: false });
  });
  console.log(`\n👀 Following ${lf} (Ctrl+C pt. ieșire)…`);
}
function killNative(s, force) {
  const pid = readPid(s);
  if (pid && alive(pid)) {
    if (force) {
      console.log(`🗡️  force-kill ${s} pid=${pid}`);
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
      else try { process.kill(pid, 'SIGKILL'); } catch { }
    } else {
      console.log(`🛑 kill ${s} pid=${pid}`); try { process.kill(pid, 'SIGTERM'); } catch { }
    }
  } else {
    console.log(`ℹ️  ${s}: fără PID valid`);
  }
  clearPid(s);
}

// --- NEW: ps/health/env-check ---
async function cmdPs(target) {
  const items = target && target !== 'all' ? [target] : ALL;
  const rows = [];
  for (const s of items) {
    const port = getPort(s);
    // eslint-disable-next-line no-await-in-loop
    const listening = port ? await probe(port) : null;
    const ppid = port && listening ? pidByPort(port) : null;
    rows.push({ service: s, port: port || '-', listening: listening == null ? '-' : (listening ? 'yes' : 'no'), portPid: ppid || '-', pid: readPid(s) || '-' });
  }
  table(rows, ['service', 'pid', 'port', 'listening', 'portPid']);
}
async function cmdHealth(target) {
  const items = target && target !== 'all' ? [target] : ALL;
  const rows = [];
  for (const s of items) {
    const port = getPort(s);
    if (!port) { rows.push({ service: s, port: '-', status: 'no-port', ms: '-' }); continue; }
    // eslint-disable-next-line no-await-in-loop
    const r = await httpHealth(port, '/healthz', 1500);
    rows.push({ service: s, port, status: r.code ? String(r.code) : 'timeout', ms: r.code ? `${r.ms}ms` : '-' });
  }
  table(rows, ['service', 'port', 'status', 'ms']);
}
function httpHealth(port, pathName = '/healthz', timeout = 1500) {
  return new Promise((resolve) => {
    const t = Date.now();
    const req = http.get({ host: 'localhost', port, path: pathName, timeout }, (resp) => {
      resp.resume();
      resp.on('end', () => resolve({ code: resp.statusCode, ms: Date.now() - t }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ code: null, ms: null }); });
    req.on('error', () => resolve({ code: null, ms: null }));
  });
}
function cmdEnvCheck(target) {
  const items = target && target !== 'all' ? [target] : ALL;
  const rows = [];
  for (const s of items) {
    const env = parseEnv(path.join(svcPath(s), '.env'));
    const ex = parseEnv(path.join(svcPath(s), '.env.example'));
    if (!Object.keys(ex).length) { rows.push({ service: s, status: 'no .env.example', missing: '-', extra: '-' }); continue; }
    const missing = Object.keys(ex).filter(k => !(k in env));
    const extra = Object.keys(env).filter(k => !(k in ex));
    rows.push({ service: s, status: missing.length ? 'incomplete' : 'ok', missing: missing.length ? missing.join(',') : '-', extra: extra.length ? extra.join(',') : '-' });
  }
  table(rows, ['service', 'status', 'missing', 'extra']);
}

// --- UI ---
function help() {
  console.log(`
Comenzi:
  start all|<service>          pornește
  stop all|<service>           oprește
  restart all|<service>        repornește
  status                       starea (Native PID tracking sau PM2)
  logs <service>               tail la log (Native mode)
  kill <service> [--force]     semnalizează oprirea (force = hard kill)
  ps [all|<service>]           pid/port/listening/portPid
  health [all|<service>]       GET /healthz pe localhost:PORT
  env-check [all|<service>]    compară .env vs .env.example

Servicii: ${ALL.join(', ')}
`);
}
function assertSvc(s) { if (!s || s === 'all') return; if (!ALL.includes(s)) { console.error(`❌ serviciu inexistent: ${s}`); process.exit(1); } }
function table(rows, cols) {
  const w = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c] ?? '').length)) + 2);
  console.log(cols.map((c, i) => String(c).padEnd(w[i])).join('')); console.log(w.map(n => '-'.repeat(n)).join(''));
  rows.forEach(r => console.log(cols.map((c, i) => String(r[c] ?? '').padEnd(w[i])).join('')));
}

// --- main ---
(async function main() {
  const [, , cmd, target, ...rest] = process.argv;
  const force = rest.includes('--force');
  if (!cmd || cmd === 'help' || cmd === '-h' || cmd === '--help') return help();

  const usePm2 = PM2; // auto (dacă vrei strict fără PM2, setează false)

  if (['start', 'stop', 'restart'].includes(cmd)) {
    const items = target === 'all' ? ALL : (assertSvc(target), [target]);
    for (const s of items) {
      if (cmd === 'start') usePm2 ? pm2Start(s) : startNative(s);
      if (cmd === 'stop') usePm2 ? pm2Stop(s) : stopNative(s);
      if (cmd === 'restart') usePm2 ? pm2Restart(s) : restartNative(s);
      if (cmd === 'doctor') { return cmdDoctor(); }

    }
    return;
  }
  if (cmd === 'status') return usePm2 ? pm2Status() : statusNative();
  if (cmd === 'logs') { assertSvc(target); return usePm2 ? pm2Logs(target) : logsNative(target); }
  if (cmd === 'kill') { assertSvc(target); return usePm2 ? (force ? pm2Delete(target) : pm2Stop(target)) : killNative(target, force); }
  if (cmd === 'ps') { if (target) assertSvc(target === 'all' ? null : target); return cmdPs(target); }
  if (cmd === 'health') { if (target) assertSvc(target === 'all' ? null : target); return cmdHealth(target); }
  if (cmd === 'env-check') { if (target) assertSvc(target === 'all' ? null : target); return cmdEnvCheck(target); }

  return help();
})();

async function cmdDoctor() {
  console.log('🔎 env-check'); await cmdEnvCheck();
  console.log('\n▶️ start all'); await (async () => { for (const s of ALL) startNative(s); })();
  // mic delay pt. pornire
  await new Promise(r => setTimeout(r, 1200));
  console.log('\n🧩 ps'); await cmdPs();
  console.log('\n❤️ health'); await cmdHealth();
}