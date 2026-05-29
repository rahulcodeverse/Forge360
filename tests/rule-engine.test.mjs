import assert from 'node:assert/strict';
import test from 'node:test';

test('repository includes configurable rule engine source', async () => {
  const source = await import('node:fs/promises').then((fs) => fs.readFile('libs/rule-engine/src/index.ts', 'utf8'));
  assert.match(source, /ConfigurableRuleEngine/);
  assert.doesNotMatch(source, /PF|ESIC|PAYE|W2|W4|1099/);
});

