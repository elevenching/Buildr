import assert from 'node:assert/strict';
import test from 'node:test';
import { runVerificationDag } from '../tools/verification/dag-scheduler.mjs';

const step = (id, dependsOn = [], concurrencyClass = 'default') => ({ id, name: id, dependsOn, concurrencyClass });
const plan = (steps) => ({ steps });

test('scheduler 遵守全局与 class 上限并按 plan 顺序返回', async () => {
  let active = 0;
  let peak = 0;
  const started = [];
  const results = await runVerificationDag(plan([step('a'), step('b'), step('c')]), {
    concurrency: { global: 2, classes: { default: 2, exclusive: 1 } },
    onStart: (item) => started.push(item.id),
    execute: async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 15));
      active -= 1;
      return { status: 'passed', exitCode: 0, durationMs: 15 };
    },
  });
  assert.equal(peak, 2);
  assert.deepEqual(started, ['a', 'b', 'c']);
  assert.deepEqual(results.map((item) => item.id), ['a', 'b', 'c']);
});

test('scheduler 将失败依赖的传递后续标记 blocked 并保留无关结果', async () => {
  const results = await runVerificationDag(plan([
    step('root'), step('child', ['root']), step('grandchild', ['child']), step('independent'),
  ]), {
    concurrency: { global: 4, classes: { default: 4, exclusive: 1 } },
    execute: async (item) => ({ status: item.id === 'root' ? 'failed' : 'passed', exitCode: item.id === 'root' ? 7 : 0, durationMs: 1 }),
  });
  assert.deepEqual(results.map((item) => item.status), ['failed', 'blocked', 'blocked', 'passed']);
  assert.equal(results[1].blockedBy, 'root');
  assert.equal(results[2].blockedBy, 'child');
});

test('exclusive step 不与其他 step 重叠', async () => {
  const events = [];
  await runVerificationDag(plan([step('a'), step('exclusive', [], 'exclusive'), step('b')]), {
    concurrency: { global: 3, classes: { default: 3, exclusive: 1 } },
    execute: async (item) => {
      events.push(`start:${item.id}`);
      await new Promise((resolve) => setTimeout(resolve, 5));
      events.push(`end:${item.id}`);
      return { status: 'passed', exitCode: 0, durationMs: 5 };
    },
  });
  const exclusiveStart = events.indexOf('start:exclusive');
  const exclusiveEnd = events.indexOf('end:exclusive');
  for (const id of ['a', 'b']) {
    const start = events.indexOf(`start:${id}`);
    const end = events.indexOf(`end:${id}`);
    assert.ok(end < exclusiveStart || start > exclusiveEnd, `${id} overlapped exclusive`);
  }
});
