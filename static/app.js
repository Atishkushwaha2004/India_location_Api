// === INDIA LOCATION API DASHBOARD ===

const API_BASE = window.location.origin;
let apiKey = localStorage.getItem('india_api_key') || '';

// ── DOM READY ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (apiKey) {
    document.getElementById('apiKeyInput').value = apiKey;
    document.getElementById('apiKeyDisplay').textContent = maskKey(apiKey);
  }
  initNav();
  loadPage('home');
  loadCounts();
});

// ── API KEY ────────────────────────────────────────────────────────────────
function saveApiKey() {
  const input = document.getElementById('apiKeyInput');
  apiKey = input.value.trim();
  localStorage.setItem('india_api_key', apiKey);
  document.getElementById('apiKeyDisplay').textContent = maskKey(apiKey);
  showToast('API Key saved!', 'success');
}

function maskKey(key) {
  if (!key) return 'Not set';
  if (key.length <= 8) return '•'.repeat(key.length);
  return key.slice(0, 4) + '•'.repeat(Math.max(0, key.length - 8)) + key.slice(-4);
}

// ── NAVIGATION ────────────────────────────────────────────────────────────
function initNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      if (page) loadPage(page);
    });
  });
}

function loadPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');
  const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (nav) nav.classList.add('active');
  const titles = {
    home: 'Dashboard Overview',
    explore: 'API Explorer',
    search: 'Village Search',
    hierarchy: 'Location Hierarchy',
    logs: 'Request Logs',
    usage: 'Usage Analytics'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

  if (page === 'home') loadCounts();
  if (page === 'logs') loadLogs();
  if (page === 'usage') loadUsage();
  if (page === 'hierarchy') initHierarchy();
}

// ── FETCH HELPER ──────────────────────────────────────────────────────────
async function apiFetch(path, showError = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
    return { ok: true, data, status: res.status };
  } catch (e) {
    if (showError) showToast(e.message, 'error');
    return { ok: false, error: e.message };
  }
}

// ── COUNTS (HOME) ─────────────────────────────────────────────────────────
async function loadCounts() {
  const result = await apiFetch('/counts', false);
  if (!result.ok) return;
  const { states, districts, sub_districts, villages } = result.data;
  animateCount('count-states', states);
  animateCount('count-districts', districts);
  animateCount('count-sub', sub_districts);
  animateCount('count-villages', villages);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = 0;
  const duration = 1200;
  const startTime = performance.now();
  function update(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * ease).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ── ENDPOINT RUNNER ───────────────────────────────────────────────────────
async function runEndpoint(id, pathFn) {
  const box = document.getElementById(`res-${id}`);
  const inputEl = document.getElementById(`in-${id}`);
  const inputVal = inputEl ? inputEl.value.trim() : '';

  box.className = 'response-box loading';
  box.textContent = '⟳ Fetching...';

  const path = typeof pathFn === 'function' ? pathFn(inputVal) : pathFn;
  const result = await apiFetch(path, false);

  if (result.ok) {
    box.className = 'response-box success';
    box.textContent = JSON.stringify(result.data, null, 2);
  } else {
    box.className = 'response-box error';
    box.textContent = `✗ Error: ${result.error}`;
  }
}

// ── VILLAGE SEARCH ────────────────────────────────────────────────────────
let searchTimeout;
function onSearchInput() {
  clearTimeout(searchTimeout);
  const q = document.getElementById('searchQuery').value.trim();
  if (q.length >= 2) {
    searchTimeout = setTimeout(() => doSearch(q), 400);
  } else {
    document.getElementById('searchResults').innerHTML = '';
  }
}

function onSearchKey(e) {
  if (e.key === 'Enter') {
    clearTimeout(searchTimeout);
    doSearch(document.getElementById('searchQuery').value.trim());
  }
}

async function doSearch(q) {
  if (!q || q.length < 2) return;
  const container = document.getElementById('searchResults');
  container.innerHTML = `<div class="hierarchy-loading"><span class="spinner"></span>&nbsp; Searching...</div>`;

  const result = await apiFetch(`/search?q=${encodeURIComponent(q)}`, false);

  if (!result.ok) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">No villages found for "<strong>${q}</strong>"</div></div>`;
    return;
  }

  const items = result.data;
  container.innerHTML = items.map((item, i) => `
    <div class="result-item" style="animation-delay:${i * 0.04}s">
      <span class="result-rank">${String(i + 1).padStart(2, '0')}</span>
      <div class="result-main">
        <span class="result-village">${highlight(item.village, q)}</span>
        <span class="result-breadcrumb">${item.sub_district} → ${item.district}</span>
      </div>
      <span class="result-state-badge">${item.state}</span>
    </div>
  `).join('');
}

function highlight(text, q) {
  if (!q) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<mark style="background:rgba(0,229,160,0.25);color:inherit;border-radius:2px;">$1</mark>');
}

// ── HIERARCHY EXPLORER ────────────────────────────────────────────────────
let selected = { state: null, district: null, sub_district: null };
let villageOffset = 0;
let villageTotal = 0;
const VILLAGE_LIMIT = 20;

async function initHierarchy() {
  const col = document.getElementById('h-states');
  col.innerHTML = '<div class="hierarchy-loading"><span class="spinner"></span></div>';
  const result = await apiFetch('/states', false);
  if (!result.ok) {
    col.innerHTML = '<div class="hierarchy-loading">Failed to load</div>';
    return;
  }
  const states = result.data;
  document.getElementById('h-states-count').textContent = states.length;
  col.innerHTML = states.map(s => `
    <div class="hierarchy-item" onclick="selectState('${s.name.replace(/'/g, "\\'")}')" id="hs-${s.id}">
      <span>${s.name}</span>
      <span class="hierarchy-arrow">›</span>
    </div>
  `).join('');
  clearColumns(['districts', 'sub_districts', 'villages']);
}

async function selectState(name) {
  selected.state = name;
  selected.district = null;
  selected.sub_district = null;
  document.querySelectorAll('#h-states .hierarchy-item').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');

  clearColumns(['districts', 'sub_districts', 'villages']);
  const col = document.getElementById('h-districts');
  col.innerHTML = '<div class="hierarchy-loading"><span class="spinner"></span></div>';

  const result = await apiFetch(`/districts/${encodeURIComponent(name)}`, false);
  if (!result.ok) { col.innerHTML = '<div class="hierarchy-loading">Not found</div>'; return; }

  const items = result.data;
  document.getElementById('h-districts-count').textContent = items.length;
  col.innerHTML = items.map(d => `
    <div class="hierarchy-item" onclick="selectDistrict('${d.name.replace(/'/g, "\\'")}', event)">
      <span>${d.name}</span>
      <span class="hierarchy-arrow">›</span>
    </div>
  `).join('');
}

async function selectDistrict(name, e) {
  selected.district = name;
  selected.sub_district = null;
  document.querySelectorAll('#h-districts .hierarchy-item').forEach(el => el.classList.remove('selected'));
  if (e && e.currentTarget) e.currentTarget.classList.add('selected');

  clearColumns(['sub_districts', 'villages']);
  const col = document.getElementById('h-sub_districts');
  col.innerHTML = '<div class="hierarchy-loading"><span class="spinner"></span></div>';

  const result = await apiFetch(`/sub_districts/${encodeURIComponent(name)}`, false);
  if (!result.ok) { col.innerHTML = '<div class="hierarchy-loading">Not found</div>'; return; }

  const items = result.data;
  document.getElementById('h-sub_districts-count').textContent = items.length;
  col.innerHTML = items.map(sd => `
    <div class="hierarchy-item" onclick="selectSubDistrict('${sd.name.replace(/'/g, "\\'")}', event)">
      <span>${sd.name}</span>
      <span class="hierarchy-arrow">›</span>
    </div>
  `).join('');
}

async function selectSubDistrict(name, e) {
  selected.sub_district = name;
  villageOffset = 0;
  document.querySelectorAll('#h-sub_districts .hierarchy-item').forEach(el => el.classList.remove('selected'));
  if (e && e.currentTarget) e.currentTarget.classList.add('selected');
  await loadVillages();
}

async function loadVillages() {
  const name = selected.sub_district;
  if (!name) return;
  const col = document.getElementById('h-villages');
  col.innerHTML = '<div class="hierarchy-loading"><span class="spinner"></span></div>';

  const result = await apiFetch(`/villages/${encodeURIComponent(name)}?limit=${VILLAGE_LIMIT}&offset=${villageOffset}`, false);
  if (!result.ok) { col.innerHTML = '<div class="hierarchy-loading">Not found</div>'; return; }

  const { data, limit, offset } = result.data;
  document.getElementById('h-villages-count').textContent = data.length > 0 ? `${offset + 1}–${offset + data.length}` : '0';

  if (data.length === 0) {
    col.innerHTML = '<div class="hierarchy-loading">No villages</div>';
  } else {
    col.innerHTML = data.map(v => `
      <div class="hierarchy-item">
        <span>🏘 ${v.name}</span>
      </div>
    `).join('');
  }

  // pagination
  document.getElementById('h-prev').disabled = offset === 0;
  document.getElementById('h-next').disabled = data.length < limit;
}

function hierarchyPage(dir) {
  villageOffset = Math.max(0, villageOffset + dir * VILLAGE_LIMIT);
  loadVillages();
}

function clearColumns(cols) {
  cols.forEach(c => {
    const col = document.getElementById(`h-${c}`);
    if (col) col.innerHTML = '<div class="hierarchy-loading" style="color:#1e2d35">—</div>';
    const count = document.getElementById(`h-${c}-count`);
    if (count) count.textContent = '—';
  });
}

// ── LOGS ──────────────────────────────────────────────────────────────────
async function loadLogs() {
  const tbody = document.getElementById('logs-tbody');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;"><span class="spinner"></span></td></tr>`;

  const result = await apiFetch('/admin/logs', false);
  if (!result.ok) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--danger);padding:24px;">Failed to load logs</td></tr>`;
    return;
  }

  const logs = result.data;
  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted);">No logs yet</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const statusClass = `status-${l.status_code}`;
    const barWidth = Math.min(80, (l.response_time_ms / 500) * 80);
    const endpoint = l.endpoint || '/';
    const params = l.query_param ? `<span style="color:var(--muted);font-size:10px;">${l.query_param.slice(0,30)}</span>` : '';
    const time = l.created_at ? new Date(l.created_at).toLocaleString() : '—';
    return `
      <tr>
        <td><span class="endpoint-tag">${endpoint}</span>${params ? '<br>' + params : ''}</td>
        <td><span class="font-mono text-xs text-muted">${l.method || 'GET'}</span></td>
        <td><span class="status-badge ${statusClass}">${l.status_code}</span></td>
        <td class="time-val">${l.response_time_ms}ms<span class="time-bar" style="width:${barWidth}px"></span></td>
        <td class="text-xs text-muted font-mono">${time}</td>
      </tr>
    `;
  }).join('');
}

// ── USAGE ─────────────────────────────────────────────────────────────────
async function loadUsage() {
  const tbody = document.getElementById('usage-tbody');
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;"><span class="spinner"></span></td></tr>`;

  const result = await apiFetch('/admin/usage', false);
  if (!result.ok) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger);padding:24px;">Failed to load usage</td></tr>`;
    return;
  }

  const data = result.data;
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted);">No usage data yet</td></tr>`;
    return;
  }

  const maxCalls = Math.max(...data.map(d => d.total_calls));

  tbody.innerHTML = data.map((d, i) => {
    const barW = Math.max(4, Math.round((d.total_calls / maxCalls) * 80));
    const lastUsed = d.last_used ? new Date(d.last_used).toLocaleString() : '—';
    return `
      <tr>
        <td style="color:var(--muted);font-family:'DM Mono',monospace;font-size:10px;">${String(i+1).padStart(2,'0')}</td>
        <td style="font-weight:500;">${d.client}</td>
        <td><span class="endpoint-tag">${d.endpoint}</span></td>
        <td>
          <span class="font-mono text-xs">${d.total_calls.toLocaleString()}</span>
          <span class="time-bar" style="width:${barW}px;background:linear-gradient(90deg,var(--accent2),var(--accent));opacity:0.5;"></span>
        </td>
        <td class="time-val">${d.avg_response_ms}ms</td>
      </tr>
    `;
  }).join('');
}

// ── TOAST ─────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : type === 'warning' ? 'warning' : ''}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}