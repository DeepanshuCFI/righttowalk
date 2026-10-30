import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/rtw.js', import.meta.url), 'utf8');
let uploads = 0;
const context = vm.createContext({
  RTW: {url: 'https://example.invalid', anon: 'public-key'},
  fetch: async (_url, options) => { uploads++; return {ok: true, status: 200, options}; },
});
vm.runInContext(source, context);

const path = 'pending/123e4567-e89b-42d3-a456-426614174000/spot.jpg';
await assert.rejects(context.rtwUpload(path, {type: 'image/png', size: 100}), /re-encoded JPEG/);
await assert.rejects(context.rtwUpload(path, {type: 'image/jpeg', size: 3145729}), /re-encoded JPEG/);
await assert.rejects(context.rtwUpload('published/123e4567-e89b-42d3-a456-426614174000/spot.jpg', {type: 'image/jpeg', size: 100}), /re-encoded JPEG/);
assert.equal(uploads, 0, 'invalid files must not reach Storage');
await context.rtwUpload(path, {type: 'image/jpeg', size: 100});
assert.equal(uploads, 1, 're-encoded JPEG at a pending check path reaches Storage');
