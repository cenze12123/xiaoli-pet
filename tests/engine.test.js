import test from 'node:test';
import assert from 'node:assert/strict';
import { CELL, STATES, frameAt, duration, lookForVector, constrainPosition } from '../engine.js';

test('all 73 populated frames map inside the intended atlas cells', () => {
  let count = 0;
  for (const [name, state] of Object.entries(STATES)) {
    let elapsed = 0;
    for (let col = 0; col < state.times.length; col++) {
      const frame = frameAt(name, elapsed);
      assert.equal(frame.row, state.row); assert.equal(frame.col, col);
      assert.ok((col + 1) * CELL.width <= CELL.atlasWidth);
      elapsed += state.times[col]; count++;
    }
    assert.equal(elapsed, duration(name));
    assert.equal(frameAt(name, elapsed).col, 0);
    assert.equal(frameAt(name, elapsed, false).done, true);
    assert.equal(frameAt(name, elapsed, false).col, state.times.length - 1);
  }
  assert.equal(count + 16, 73);
});
test('sixteen gaze directions are clockwise from screen-up, including both row seams', () => {
  for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI / 8;
    const look = lookForVector(Math.sin(angle) * 100, -Math.cos(angle) * 100);
    assert.equal(look.index, i); assert.equal(look.row, 9 + Math.floor(i / 8)); assert.equal(look.col, i % 8);
  }
  assert.equal(lookForVector(0, -100).index, 0);
  assert.equal(lookForVector(100, 0).index, 4);
  assert.equal(lookForVector(0, 100).index, 8);
  assert.equal(lookForVector(-100, 0).index, 12);
  assert.equal(lookForVector(0, 0), null);
  assert.equal(lookForVector(10, 10), null);
  assert.equal(lookForVector(NaN, 100), null);
});
test('dragging and keyboard movement stay within desktop and mobile stage bounds', () => {
  for (const [width,height,scale] of [[800,448,1.7],[340,390,1.45],[280,390,1.35]]) {
    for (const [x,y] of [[-999,-999],[9999,9999],[width/2,height/2]]) {
      const actual = constrainPosition(x,y,scale,width,height);
      assert.ok(actual.x - CELL.width*scale/2 >= 0);
      assert.ok(actual.x + CELL.width*scale/2 <= width);
      assert.ok(actual.y - CELL.height*scale >= 0);
      assert.ok(actual.y <= height - 40);
    }
  }
});
