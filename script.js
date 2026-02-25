// ===== 数据 =====
const agents = [
  '铁臂', '捷风', '雷兹', '幽影', '炼狱', '不死鸟', '贤者',
  '猎枭', '蝰蛇', '零', '芮娜', '奇乐', '斯凯', '夜露',
  '星礈', 'K/O', '尚勃勒', '霓虹', '黑梦', '海神', '盖可',
  '钢锁', '壹决', '暮蝶', '维斯', '钛狐', '幻棱', '禁灭'
];

// 手枪 (Sidearms)
const sidearms = [
  '标配', '短炮', '狂怒', '鬼魅', '正义'
];

// 长枪 (Primary weapons)
const primaries = [
  '蜂刺', '骇灵',             // 冲锋枪
  '雄鹿', '判官',             // 霰弹枪
  '獠犬', '戍卫', '幻影', '飞将', // 步枪
  '莽侠', '追猎', '冥驹',       // 狙击枪
  '狂徒', '战神', '奥丁'        // 机枪
];

// ===== 状态 =====
let agentRotation = 0;
let sidearmRotation = 0;
let primaryRotation = 0;
let spinning = false;

const SPIN_DURATION = 3000;
const MIN_SPINS = 5;
const MAX_SPINS = 8;
const CANVAS_SIZE = 260;

// ===== DOM =====
const $ = (id) => document.getElementById(id);

const els = {
  btnAll: $('btnSpinAll'),
  btnAgent: $('btnSpinAgent'),
  btnSidearm: $('btnSpinSidearm'),
  btnPrimary: $('btnSpinPrimary'),
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
};

// ===== Canvas 绘制转盘 =====
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
  const startOffset = -Math.PI / 2; // 12 点钟方向

  // 动态字号：项目越多字越小
  const fontSize = Math.max(10, Math.min(15, Math.floor(CANVAS_SIZE / n * 0.9)));

  const colors = ['#1a1a1a', '#212121'];

  for (let i = 0; i < n; i++) {
    const a1 = startOffset + i * slice;
    const a2 = startOffset + (i + 1) * slice;

    // 扇区
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, a1, a2);
    ctx.closePath();
    ctx.fillStyle = colors[i % 2];
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // 文字
    const textAngle = a1 + slice / 2;
    const textR = radius * 0.68;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(textAngle);
    ctx.fillStyle = '#d4d4d4';
    ctx.font = `500 ${fontSize}px Inter, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(items[i], textR, 0);
    ctx.restore();
  }

  // 中心圆
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#0e0e0e';
  ctx.fill();
  ctx.strokeStyle = '#ff4655';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ===== 旋转逻辑（已修复角度计算） =====
function spinWheel(rotatorEl, items, currentRotation) {
  const n = items.length;
  const sliceAngle = 360 / n;
  const targetIndex = Math.floor(Math.random() * n);

  // 段中心角度（从顶部顺时针计）
  const targetCenter = targetIndex * sliceAngle + sliceAngle / 2;

  // 要让该段转到顶部指针处，总旋转量 mod 360 应等于 (360 - targetCenter)
  // 因为顺时针旋转 θ 后，原本在 θ 处的段会移走，
  // 而原本在 (360 - θ) 处的段会移到顶部
  const targetMod = ((360 - targetCenter) % 360 + 360) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;

  let remaining = targetMod - currentMod;
  if (remaining <= 0) remaining += 360;

  const spins = MIN_SPINS + Math.floor(Math.random() * (MAX_SPINS - MIN_SPINS + 1));
  // 段内随机偏移 ±30%，确保不越界
  const jitter = (Math.random() - 0.5) * sliceAngle * 0.6;

  const newRotation = currentRotation + remaining + spins * 360 + jitter;
  rotatorEl.style.transform = `rotate(${newRotation}deg)`;

  return { rotation: newRotation, selected: items[targetIndex] };
}

// ===== 按钮状态 =====
function setButtonsDisabled(disabled) {
  els.btnAll.disabled = disabled;
  els.btnAgent.disabled = disabled;
  els.btnSidearm.disabled = disabled;
  els.btnPrimary.disabled = disabled;
}

// ===== 结果更新 =====
function updateCombinedResult(agent, sidearm, primary) {
  if (agent && sidearm && primary) {
    els.resultText.innerHTML =
      `<span class="hl">${agent}</span>` +
      `<span class="sep">·</span>` +
      `<span class="hl">${sidearm}</span>` +
      `<span class="sep">+</span>` +
      `<span class="hl">${primary}</span>`;
    els.resultText.className = 'result-text active';
  }
}

// ===== 单独旋转 =====
function doSpinAgent() {
  if (spinning) return;
  spinning = true;
  setButtonsDisabled(true);
  const result = spinWheel(els.agentRotator, agents, agentRotation);
  agentRotation = result.rotation;
  setTimeout(() => {
    els.agentResult.textContent = result.selected;
    els.agentResult.className = 'wheel-result active';
    spinning = false;
    setButtonsDisabled(false);
  }, SPIN_DURATION + 100);
}

function doSpinSidearm() {
  if (spinning) return;
  spinning = true;
  setButtonsDisabled(true);
  const result = spinWheel(els.sidearmRotator, sidearms, sidearmRotation);
  sidearmRotation = result.rotation;
  setTimeout(() => {
    els.sidearmResult.textContent = result.selected;
    els.sidearmResult.className = 'wheel-result active';
    spinning = false;
    setButtonsDisabled(false);
  }, SPIN_DURATION + 100);
}

function doSpinPrimary() {
  if (spinning) return;
  spinning = true;
  setButtonsDisabled(true);
  const result = spinWheel(els.primaryRotator, primaries, primaryRotation);
  primaryRotation = result.rotation;
  setTimeout(() => {
    els.primaryResult.textContent = result.selected;
    els.primaryResult.className = 'wheel-result active';
    spinning = false;
    setButtonsDisabled(false);
  }, SPIN_DURATION + 100);
}

// ===== 一键抽取 =====
function spinAll() {
  if (spinning) return;
  spinning = true;
  setButtonsDisabled(true);

  const aResult = spinWheel(els.agentRotator, agents, agentRotation);
  const sResult = spinWheel(els.sidearmRotator, sidearms, sidearmRotation);
  const pResult = spinWheel(els.primaryRotator, primaries, primaryRotation);

  agentRotation = aResult.rotation;
  sidearmRotation = sResult.rotation;
  primaryRotation = pResult.rotation;

  setTimeout(() => {
    els.agentResult.textContent = aResult.selected;
    els.agentResult.className = 'wheel-result active';
    els.sidearmResult.textContent = sResult.selected;
    els.sidearmResult.className = 'wheel-result active';
    els.primaryResult.textContent = pResult.selected;
    els.primaryResult.className = 'wheel-result active';

    updateCombinedResult(aResult.selected, sResult.selected, pResult.selected);
    spinning = false;
    setButtonsDisabled(false);
  }, SPIN_DURATION + 100);
}

// ===== 事件绑定 =====
els.btnAll.addEventListener('click', spinAll);
els.btnAgent.addEventListener('click', doSpinAgent);
els.btnSidearm.addEventListener('click', doSpinSidearm);
els.btnPrimary.addEventListener('click', doSpinPrimary);

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
}

init();
