import { CELL, STATES, duration, frameAt, lookForVector, constrainPosition } from './engine.js';

const $ = id => document.getElementById(id);
const stage = $('stage'), pet = $('pet'), sprite = $('sprite'), shadow = $('pet-shadow');
const actionButtons = [...document.querySelectorAll('[data-action]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let scale = innerWidth <= 720 ? 1.45 : 1.7;
let position = { x: 0, y: 0 }, state = 'idle', stateStart = performance.now();
let paused = reducedMotion.matches, hiddenAt = null, pointer = null, drag = null, roaming = false;
let targetX = null, nextWalk = performance.now() + 4500, loaded = false, lastTime = null;
let clickTimer, holdUntil = 0, lastFrame = '', lastActivity = '';
let draggingOccurred = false;

function setActivity(text) {
  if (text !== lastActivity) { $('activity').textContent = text; lastActivity = text; }
}
function setState(next, now = performance.now()) {
  if (!STATES[next]) return;
  state = next; stateStart = now;
  actionButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.action === state)));
  setActivity(paused ? '静静陪你 · 动画已暂停' : STATES[state].label);
}
function setFrame(row, col) {
  const key = `${row}:${col}`;
  if (lastFrame !== key) { sprite.style.backgroundPosition = `${-col * CELL.width}px ${-row * CELL.height}px`; lastFrame = key; }
  pet.dataset.row = row; pet.dataset.frame = col; pet.dataset.state = state;
}
function fit() {
  if (stage.clientWidth < 100 || stage.clientHeight < 100) return;
  const max = Math.max(1, Math.min(2.2, (stage.clientWidth - 12) / CELL.width, (stage.clientHeight - 66) / CELL.height));
  scale = Math.max(1, Math.min(Number.isFinite(scale) ? scale : 1.7, max));
  $('size-range').max = Math.floor(max * 20) / 20;
  $('size-range').value = scale;
  $('size-value').textContent = `${scale.toFixed(2).replace(/0$/, '')}×`;
  position = constrainPosition(position.x, position.y, scale, stage.clientWidth, stage.clientHeight);
  renderPosition();
}
function renderPosition() {
  pet.style.width = `${CELL.width * scale}px`; pet.style.height = `${CELL.height * scale}px`;
  pet.style.left = `${position.x - CELL.width * scale / 2}px`;
  pet.style.top = `${position.y - CELL.height * scale}px`;
  sprite.style.transform = `scale(${scale})`;
  shadow.style.left = `${position.x}px`; shadow.style.top = `${position.y - 6 * scale}px`;
  shadow.style.width = `${43 * scale}px`;
}
function reset() {
  clearTimeout(clickTimer); pointer = null; targetX = null;
  position = { x: stage.clientWidth / 2, y: stage.clientHeight - 54 };
  fit(); setState('idle'); holdUntil = 0; nextWalk = performance.now() + 4500;
}
function play(next) {
  if (!loaded) return;
  clearTimeout(clickTimer); targetX = null; pointer = null;
  if (paused) { paused = false; syncPause(); }
  setState(next); holdUntil = 0; nextWalk = performance.now() + duration(next) + 4000;
}
function syncPause() {
  $('pause-button').textContent = paused ? '继续动画' : '暂停动画';
  $('pause-button').setAttribute('aria-pressed', String(paused));
  if (paused) { targetX = null; setState('idle'); setFrame(0, 0); }
  else { stateStart = performance.now(); setActivity(STATES[state].label); nextWalk = performance.now() + 3500; }
}
function localPoint(event) { const rect = stage.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
function stopRoaming() { roaming = false; targetX = null; $('roam-toggle').checked = false; }

actionButtons.forEach(button => { button.disabled = true; button.addEventListener('click', () => play(button.dataset.action)); });
$('pause-button').addEventListener('click', () => { paused = !paused; syncPause(); });
$('reset-button').addEventListener('click', reset);
$('size-range').addEventListener('input', event => { scale = Number(event.target.value); fit(); });
$('roam-toggle').addEventListener('change', event => {
  roaming = event.target.checked; targetX = null; nextWalk = performance.now() + 300;
  if (roaming && paused) { paused = false; syncPause(); nextWalk = performance.now() + 300; }
  if (!roaming && state.startsWith('running-')) setState('idle');
});
$('theme-button').addEventListener('click', () => {
  const night = document.body.classList.toggle('night');
  $('theme-icon').textContent = night ? '☀' : '☾';
  $('theme-button').setAttribute('aria-label', night ? '切换为暖昼模式' : '切换为静夜模式');
  try { localStorage.setItem('xiaoli-theme', night ? 'night' : 'day'); } catch {}
});
try { if (localStorage.getItem('xiaoli-theme') === 'night') $('theme-button').click(); } catch {}

window.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch') return;
  const point = localPoint(event); pointer = point;
});
document.documentElement.addEventListener('pointerleave', () => { pointer = null; });
pet.addEventListener('pointerdown', event => {
  if (!loaded || event.button !== 0) return;
  const point = localPoint(event);
  drag = { id: event.pointerId, start: point, origin: { ...position }, moved: false };
  draggingOccurred = false; targetX = null;
  pet.setPointerCapture(event.pointerId);
  pet.classList.add('dragging'); event.preventDefault();
});
pet.addEventListener('pointermove', event => {
  if (!drag || drag.id !== event.pointerId) return;
  const point = localPoint(event), dx = point.x - drag.start.x, dy = point.y - drag.start.y;
  if (Math.hypot(dx, dy) > 5) drag.moved = true;
  if (!drag.moved) return;
  position = constrainPosition(drag.origin.x + dx, drag.origin.y + dy, scale, stage.clientWidth, stage.clientHeight);
  const next = dx >= 0 ? 'running-right' : 'running-left';
  if (state !== next) setState(next);
  renderPosition(); $('interaction-hint').textContent = '松开手，就在这里陪你';
});
function finishDrag(event) {
  if (!drag || drag.id !== event.pointerId) return;
  draggingOccurred = drag.moved; drag = null;
  pet.classList.remove('dragging');
  if (pet.hasPointerCapture(event.pointerId)) pet.releasePointerCapture(event.pointerId);
  setState('idle'); holdUntil = performance.now() + 700; nextWalk = performance.now() + 5000;
  $('interaction-hint').textContent = '移动鼠标，或拖动小栗';
}
pet.addEventListener('pointerup', finishDrag);
pet.addEventListener('pointercancel', finishDrag);
pet.addEventListener('lostpointercapture', event => { if (drag) finishDrag(event); });
pet.addEventListener('click', event => {
  if (draggingOccurred) { draggingOccurred = false; return; }
  if (event.detail > 1) return;
  clearTimeout(clickTimer); clickTimer = setTimeout(() => play('waving'), 220);
});
pet.addEventListener('dblclick', () => { if (!draggingOccurred) play('jumping'); });
pet.addEventListener('keydown', event => {
  if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); play(event.key === ' ' ? 'jumping' : 'waving'); return; }
  const vectors = { ArrowLeft: [-18,0], ArrowRight: [18,0], ArrowUp: [0,-12], ArrowDown: [0,12] };
  if (!vectors[event.key]) return;
  event.preventDefault(); stopRoaming(); pointer = null;
  const [dx, dy] = vectors[event.key];
  position = constrainPosition(position.x + dx, position.y + dy, scale, stage.clientWidth, stage.clientHeight);
  renderPosition(); play(dx < 0 ? 'running-left' : 'running-right');
});
new ResizeObserver(fit).observe(stage);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = performance.now();
  else if (hiddenAt !== null) { const delta = performance.now() - hiddenAt; stateStart += delta; nextWalk += delta; hiddenAt = null; lastTime = null; }
});
reducedMotion.addEventListener('change', event => { if (event.matches) { paused = true; syncPause(); } });

function tick(now) {
  const dt = lastTime === null ? 0 : Math.min(now - lastTime, 50); lastTime = now;
  if (loaded && !paused && !document.hidden) {
    if (roaming && !drag && state === 'idle' && now > nextWalk) {
      const half = CELL.width * scale / 2 + 8;
      const room = stage.clientWidth - half * 2;
      if (room > 30) { targetX = half + Math.random() * room; setState(targetX >= position.x ? 'running-right' : 'running-left', now); }
      else nextWalk = now + 5000;
    }
    if (targetX !== null && !drag) {
      const difference = targetX - position.x, step = 55 * dt / 1000;
      if (Math.abs(difference) <= Math.max(step, 1)) { position.x = targetX; targetX = null; setState('idle', now); nextWalk = now + 3000 + Math.random() * 3500; }
      else position.x += Math.sign(difference) * step;
      renderPosition();
    }
    const loop = state === 'idle' || state.startsWith('running-') && (targetX !== null || drag);
    const frame = frameAt(state, now - stateStart, Boolean(loop));
    if (frame.done) { setState('idle', now); holdUntil = now + 550; setFrame(0, 0); }
    else if (state === 'idle' && pointer && !drag && now > holdUntil) {
      const head = { x: position.x, y: position.y - 184 * scale };
      const look = lookForVector(pointer.x - head.x, pointer.y - head.y, 27 * scale);
      if (look) { setFrame(look.row, look.col); setActivity('看见你啦'); }
      else { setFrame(frame.row, frame.col); setActivity(STATES.idle.label); }
    } else { setFrame(frame.row, frame.col); setActivity(STATES[state].label); }
  }
  requestAnimationFrame(tick);
}
syncPause(); reset(); requestAnimationFrame(tick);
const image = new Image();
image.onload = () => { loaded = true; $('loading').hidden = true; pet.classList.add('ready'); actionButtons.forEach(b => b.disabled = false); setFrame(0, 0); };
image.onerror = () => { $('loading').textContent = '小栗的图片没有加载成功，请刷新重试。'; };
image.src = new URL('./assets/xiaoli.png', import.meta.url).href;
