const fs = require('fs');
const path = require('path');

async function run() {
  const testDir = path.join(__dirname);
  const files = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js'));
  let failed = 0;

  for (const file of files) {
    console.log(`Running ${file}...`);
    try {
      await require(path.join(testDir, file));
      console.log(`✓ ${file} passed`);
    } catch (err) {
      failed++;
      console.error(`✗ ${file} failed`);
      console.error(err);
    }
  }

  if (failed > 0) {
    console.error(`${failed} test(s) failed.`);
    process.exit(1);
  } else {
    console.log('All tests passed.');
  }
}

run();
