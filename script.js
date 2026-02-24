// ===== 数据 =====
const agents = [
  '铁臂', '捷风', '雷兹', '幽影', '炼狱', '不死鸟', '贤者',
  '猎枭', '蝰蛇', '零',  '芮娜', '奇乐', '斯凯', '夜露',
  '星礈', 'K/O',  '尚勃勒','霓虹', '黑梦', '海神', '盖可',
  '钢锁', '壹决', '暮蝶', '维斯', '钛狐', '幻棱', '禁灭'
];

const weapons = [
  // 手枪
  '标配', '短炮', '狂怒', '鬼魅', '正义',
  // 冲锋枪
  '蜂刺', '骇灵',
  // 霰弹枪
  '雄鹿', '判官',
  // 步枪
  '獠犬', '戍卫', '幻影', '飞将',
  // 狙击枪
  '莽侠', '追猎', '冥驹',
  // 机枪
  '狂徒', '战神', '奥丁'
];

// ===== 状态 =====
let agentRotation = 0;
let weaponRotation = 0;
let spinning = false;

const SPIN_DURATION = 3000; // ms, 与 CSS transition 一致
const MIN_SPINS = 5;
const MAX_SPINS = 8;

// ===== DOM =====
const $ = (id) => document.getElementById(id);

const els = {
  btnAll:       $('btnSpinAll'),
  btnAgent:     $('btnSpinAgent'),
  btnWeapon:    $('btnSpinWeapon'),
  agentRotator: $('agentRotator'),
  weaponRotator:$('weaponRotator'),
  agentCanvas:  $('agentCanvas'),
  weaponCanvas: $('weaponCanvas'),
  agentResult:  $('agentResult'),
  weaponResult: $('weaponResult'),
  agentCount:   $('agentCount'),
  weaponCount:  $('weaponCount'),
  resultSection:$('resultSection'),
  resultText:   $('resultText'),
};

// ===== Canvas 绘制转盘 =====
function drawWheel(canvas, items) {
  const dpr = window.devicePixelRatio || 1;
  const cssSize = 320;
  canvas.width = cssSize * dpr;
  canvas.height = cssSize * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const cx = cssSize / 2;
  const cy = cssSize / 2;
  const radius = cx - 4;
  const n = items.length;
  const slice = (2 * Math.PI) / n;
  const startOffset = -Math.PI / 2; // 12 点钟方向起始

  // 动态字号
  const fontSize = Math.max(10, Math.min(14, Math.floor(cssSize / n * 0.85)));

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
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
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

  // 计算目标角度
  const targetCenter = targetIndex * sliceAngle + sliceAngle / 2;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let remaining = targetCenter - currentMod;
  if (remaining < 0) remaining += 360;

  const spins = MIN_SPINS + Math.floor(Math.random() * (MAX_SPINS - MIN_SPINS + 1));
  // 段内随机偏移 (±35%)
  const jitter = (Math.random() - 0.5) * sliceAngle * 0.7;

  const newRotation = currentRotation + remaining + spins * 360 + jitter;
  rotatorEl.style.transform = `rotate(${newRotation}deg)`;

  return { rotation: newRotation, selected: items[targetIndex] };
}

function setButtonsDisabled(disabled) {
  els.btnAll.disabled = disabled;
  els.btnAgent.disabled = disabled;
  els.btnWeapon.disabled = disabled;
}

function updateResult(agent, weapon) {
  if (agent && weapon) {
    els.resultText.innerHTML =
      `<span class="highlight">${agent}</span> 使用 <span class="highlight">${weapon}</span>`;
    els.resultText.className = 'result-text active';
  }
}

function spinAgent(callback) {
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
    if (callback) callback(result.selected);
  }, SPIN_DURATION + 100);
}

function spinWeapon(callback) {
  if (spinning) return;
  spinning = true;
  setButtonsDisabled(true);

  const result = spinWheel(els.weaponRotator, weapons, weaponRotation);
  weaponRotation = result.rotation;

  setTimeout(() => {
    els.weaponResult.textContent = result.selected;
    els.weaponResult.className = 'wheel-result active';
    spinning = false;
    setButtonsDisabled(false);
    if (callback) callback(result.selected);
  }, SPIN_DURATION + 100);
}

function spinAll() {
  if (spinning) return;
  spinning = true;
  setButtonsDisabled(true);

  const agentResult = spinWheel(els.agentRotator, agents, agentRotation);
  const weaponResult = spinWheel(els.weaponRotator, weapons, weaponRotation);
  agentRotation = agentResult.rotation;
  weaponRotation = weaponResult.rotation;

  setTimeout(() => {
    els.agentResult.textContent = agentResult.selected;
    els.agentResult.className = 'wheel-result active';
    els.weaponResult.textContent = weaponResult.selected;
    els.weaponResult.className = 'wheel-result active';
    updateResult(agentResult.selected, weaponResult.selected);
    spinning = false;
    setButtonsDisabled(false);
  }, SPIN_DURATION + 100);
}

// ===== 事件绑定 =====
els.btnAll.addEventListener('click', spinAll);
els.btnAgent.addEventListener('click', () => spinAgent());
els.btnWeapon.addEventListener('click', () => spinWeapon());

// ===== 初始化 =====
function init() {
  // 等字体加载完再绘制 canvas
  document.fonts.ready.then(() => {
    drawWheel(els.agentCanvas, agents);
    drawWheel(els.weaponCanvas, weapons);
  });

  els.agentCount.textContent = agents.length;
  els.weaponCount.textContent = weapons.length;
}

init();
