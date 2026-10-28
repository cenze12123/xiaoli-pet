export const CELL = Object.freeze({ width: 192, height: 208, atlasWidth: 1536, atlasHeight: 2288 });
export const STATES = Object.freeze({
  idle: { row: 0, times: [280, 110, 110, 140, 140, 320], label: '正在陪你' },
  'running-right': { row: 1, times: [120,120,120,120,120,120,120,220], label: '往右走走' },
  'running-left': { row: 2, times: [120,120,120,120,120,120,120,220], label: '往左走走' },
  waving: { row: 3, times: [140,140,140,280], label: '嗨，你好呀' },
  jumping: { row: 4, times: [140,140,140,140,280], label: '开心跳一下' },
  failed: { row: 5, times: [140,140,140,140,140,140,140,240], label: '有点失落，陪陪我吧' },
  waiting: { row: 6, times: [150,150,150,150,150,260], label: '在等你的回应' },
  running: { row: 7, times: [120,120,120,120,120,220], label: '让我认真想一想' },
  review: { row: 8, times: [150,150,150,150,150,280], label: '让我仔细看看' },
});
export const duration = state => STATES[state].times.reduce((sum, t) => sum + t, 0);
export function frameAt(state, elapsed, loop = true) {
  const spec = STATES[state];
  if (!spec) throw new RangeError(`Unknown animation: ${state}`);
  const total = duration(state);
  let t = loop ? Math.max(0, elapsed) % total : Math.min(Math.max(0, elapsed), total - 1);
  let col = 0;
  while (t >= spec.times[col] && col < spec.times.length - 1) t -= spec.times[col++];
  return { row: spec.row, col, done: !loop && elapsed >= total };
}
export function lookForVector(dx, dy, deadzone = 28) {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || Math.hypot(dx, dy) < deadzone) return null;
  const angle = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI);
  const index = Math.round(angle / (Math.PI / 8)) % 16;
  return { row: 9 + Math.floor(index / 8), col: index % 8, index };
}
export function constrainPosition(x, y, scale, width, height) {
  const half = CELL.width * scale / 2;
  const top = CELL.height * scale + 8;
  const left = Math.min(half + 5, width / 2);
  const right = Math.max(width - half - 5, width / 2);
  const bottom = Math.max(top, height - 40);
  return { x: Math.min(right, Math.max(left, x)), y: Math.min(bottom, Math.max(Math.min(top, height - 40), y)) };
}
