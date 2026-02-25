// ===== 数据 =====
const agents = [
  '铁臂', '捷风', '雷兹', '幽影', '炼狱', '不死鸟', '贤者',
  '猎枭', '蝰蛇', '零', '芮娜', '奇乐', '斯凯', '夜露',
  '星礈', 'K/O', '尚勃勒', '霓虹', '黑梦', '海神', '盖可',
  '钢锁', '壹决', '暮蝶', '维斯', '钛狐', '幻棱', '禁灭'
];

const sidearms = ['标配', '短炮', '狂怒', '鬼魅', '正义', '追猎'];

const primaries = [
  '蜂刺', '骇灵',
  '雄鹿', '判官',
  '獠犬', '戍卫', '幻影', '飞将',
  '莽侠', '冥驹',
  '狂徒', '战神', '奥丁'
];

// ===== 状态 =====
let agentRotation = 0;
let sidearmRotation = 0;
let primaryRotation = 0;
let spinning = false;
let spinDuration = 3; // 秒

const MIN_SPINS = 5;
const MAX_SPINS = 8;
const CANVAS_SIZE = 260;
const MAX_HISTORY = 10;
const history = [];

// ===== DOM =====
const $ = (id) => document.getElementById(id);
const els = {
  btnAll: $('btnSpinAll'),
  btnAgent: $('btnSpinAgent'),
  btnSidearm: $('btnSpinSidearm'),
  btnPrimary: $('btnSpinPrimary'),
  includeAgent: $('includeAgent'),
  includeSidearm: $('includeSidearm'),
  includePrimary: $('includePrimary'),
  spinDurationSel: $('spinDuration'),
  agentRotator: $('agentRotator'),
  sidearmRotator: $('sidearmRotator'),
  primaryRotator: $('primaryRotator'),
  agentCanvas: $('agentCanvas'),
  sidearmCanvas: $('sidearmCanvas'),
  primaryCanvas: $('primaryCanvas'),
  agentResult: $('agentResult'),
  sidearmResult: $('sidearmResult'),
  primaryResult: $('primaryResult'),
  agentCount: $('agentCount'),
  sidearmCount: $('sidearmCount'),
  primaryCount: $('primaryCount'),
  resultText: $('resultText'),
  historyBody: $('historyBody'),
  historyCount: $('historyCount'),
  historyEmpty: $('historyEmpty'),
};

// ===== Canvas 绘制 =====
function drawWheel(canvas, items) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_SIZE * dpr;
  canvas.height = CANVAS_SIZE * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const cx = CANVAS_SIZE / 2;
  const cy = CANVAS_SIZE / 2;
  const radius = cx - 4;
  const n = items.length;
  const slice = (2 * Math.PI) / n;
  const startOffset = -Math.PI / 2;
  const fontSize = Math.max(10, Math.min(15, Math.floor(CANVAS_SIZE / n * 0.9)));
  const colors = ['#1a1a1a', '#212121'];

  for (let i = 0; i < n; i++) {
    const a1 = startOffset + i * slice;
    const a2 = startOffset + (i + 1) * slice;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, a1, a2);
    ctx.closePath();
    ctx.fillStyle = colors[i % 2];
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    const textAngle = a1 + slice / 2;
    const textR = radius * 0.68;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(textAngle);
    ctx.fillStyle = '#d4d4d4';
    ctx.font = `500 ${fontSize}px LXGW WenKai, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(items[i], textR, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#0e0e0e';
  ctx.fill();
  ctx.strokeStyle = '#ff4655';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ===== 旋转逻辑 =====
function spinWheel(rotatorEl, items, currentRotation) {
  const n = items.length;
  const sliceAngle = 360 / n;
  const targetIndex = Math.floor(Math.random() * n);
  const targetCenter = targetIndex * sliceAngle + sliceAngle / 2;
  const targetMod = ((360 - targetCenter) % 360 + 360) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let remaining = targetMod - currentMod;
  if (remaining <= 0) remaining += 360;
  const spins = MIN_SPINS + Math.floor(Math.random() * (MAX_SPINS - MIN_SPINS + 1));
  const jitter = (Math.random() - 0.5) * sliceAngle * 0.6;
  const newRotation = currentRotation + remaining + spins * 360 + jitter;
  rotatorEl.style.transform = `rotate(${newRotation}deg)`;
  return { rotation: newRotation, selected: items[targetIndex] };
}

// ===== 时长控制 =====
function updateSpinDuration() {
  spinDuration = parseInt(els.spinDurationSel.value);
  document.documentElement.style.setProperty('--spin-duration', `${spinDuration}s`);
}

// ===== 按钮状态 =====
function setButtonsDisabled(disabled) {
  els.btnAll.disabled = disabled;
  els.btnAgent.disabled = disabled;
  els.btnSidearm.disabled = disabled;
  els.btnPrimary.disabled = disabled;
}

// ===== 结果 =====
function updateCombinedResult(agent, sidearm, primary) {
  const parts = [];
  if (agent) parts.push(`<span class="hl">${agent}</span>`);
  if (sidearm) parts.push(`<span class="hl">${sidearm}</span>`);
  if (primary) parts.push(`<span class="hl">${primary}</span>`);
  if (!parts.length) return;
  els.resultText.innerHTML = parts.join('<span class="sep"> · </span>');
  els.resultText.className = 'result-text active';
}

// ===== 历史记录 =====
function addHistory(agent, sidearm, primary) {
  history.unshift({
    agent: agent || '—',
    sidearm: sidearm || '—',
    primary: primary || '—',
  });
  if (history.length > MAX_HISTORY) history.pop();
  renderHistory();
}

function renderHistory() {
  const tbody = els.historyBody;
  tbody.innerHTML = '';
  history.forEach((e, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td>${i + 1}</td>` +
      `<td class="hl-cell">${e.agent}</td>` +
      `<td class="hl-cell">${e.sidearm}</td>` +
      `<td class="hl-cell">${e.primary}</td>`;
    tbody.appendChild(tr);
  });
  els.historyCount.textContent = history.length;
  els.historyEmpty.style.display = history.length ? 'none' : 'block';
}

// ===== 单独旋转 =====
function doSpinAgent() {
  if (spinning) return;
  spinning = true;
  setButtonsDisabled(true);
  const r = spinWheel(els.agentRotator, agents, agentRotation);
  agentRotation = r.rotation;
  setTimeout(() => {
    els.agentResult.textContent = r.selected;
    els.agentResult.className = 'wheel-result active';
    spinning = false;
    setButtonsDisabled(false);
  }, spinDuration * 1000 + 100);
}

function doSpinSidearm() {
  if (spinning) return;
  spinning = true;
  setButtonsDisabled(true);
  const r = spinWheel(els.sidearmRotator, sidearms, sidearmRotation);
  sidearmRotation = r.rotation;
  setTimeout(() => {
    els.sidearmResult.textContent = r.selected;
    els.sidearmResult.className = 'wheel-result active';
    spinning = false;
    setButtonsDisabled(false);
  }, spinDuration * 1000 + 100);
}

function doSpinPrimary() {
  if (spinning) return;
  spinning = true;
  setButtonsDisabled(true);
  const r = spinWheel(els.primaryRotator, primaries, primaryRotation);
  primaryRotation = r.rotation;
  setTimeout(() => {
    els.primaryResult.textContent = r.selected;
    els.primaryResult.className = 'wheel-result active';
    spinning = false;
    setButtonsDisabled(false);
  }, spinDuration * 1000 + 100);
}

// ===== 一键抽取 =====
function spinAll() {
  if (spinning) return;
  const withAgent = els.includeAgent.checked;
  const withSidearm = els.includeSidearm.checked;
  const withPrimary = els.includePrimary.checked;
  if (!withAgent && !withSidearm && !withPrimary) return;

  spinning = true;
  setButtonsDisabled(true);

  let aR = null, sR = null, pR = null;
  if (withAgent) {
    aR = spinWheel(els.agentRotator, agents, agentRotation);
    agentRotation = aR.rotation;
  }
  if (withSidearm) {
    sR = spinWheel(els.sidearmRotator, sidearms, sidearmRotation);
    sidearmRotation = sR.rotation;
  }
  if (withPrimary) {
    pR = spinWheel(els.primaryRotator, primaries, primaryRotation);
    primaryRotation = pR.rotation;
  }

  setTimeout(() => {
    if (aR) { els.agentResult.textContent = aR.selected; els.agentResult.className = 'wheel-result active'; }
    if (sR) { els.sidearmResult.textContent = sR.selected; els.sidearmResult.className = 'wheel-result active'; }
    if (pR) { els.primaryResult.textContent = pR.selected; els.primaryResult.className = 'wheel-result active'; }

    updateCombinedResult(
      aR ? aR.selected : null,
      sR ? sR.selected : null,
      pR ? pR.selected : null,
    );

    addHistory(
      aR ? aR.selected : null,
      sR ? sR.selected : null,
      pR ? pR.selected : null,
    );

    spinning = false;
    setButtonsDisabled(false);
  }, spinDuration * 1000 + 100);
}

// ===== 事件绑定 =====
els.btnAll.addEventListener('click', spinAll);
els.btnAgent.addEventListener('click', doSpinAgent);
els.btnSidearm.addEventListener('click', doSpinSidearm);
els.btnPrimary.addEventListener('click', doSpinPrimary);
els.spinDurationSel.addEventListener('change', updateSpinDuration);

// ===== 初始化 =====
function init() {
  document.fonts.ready.then(() => {
    drawWheel(els.agentCanvas, agents);
    drawWheel(els.sidearmCanvas, sidearms);
    drawWheel(els.primaryCanvas, primaries);
  });
  els.agentCount.textContent = agents.length;
  els.sidearmCount.textContent = sidearms.length;
  els.primaryCount.textContent = primaries.length;
  renderHistory();
}

init();
