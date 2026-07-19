import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeProviderPayload } from '../../supabase/functions/_shared/metrics-providers.ts';

const fixtures = JSON.parse(await readFile(new URL('./fixtures/metrics-actors.json', import.meta.url)));
for (const fixture of fixtures) {
  assert.deepEqual(normalizeProviderPayload(fixture.adapter, fixture.payload), fixture.expected, fixture.name);
  console.log(`PASS ${fixture.name}`);
}
