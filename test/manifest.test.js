const assert = require('assert');
const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

assert.strictEqual(manifest.manifest_version, 3, 'manifest_version should be 3');
assert.ok(manifest.name, 'name is required');
assert.ok(manifest.action && manifest.action.default_popup, 'default_popup required');
