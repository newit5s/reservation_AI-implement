#!/usr/bin/env node
const path = require('node:path');
const fs = require('node:fs');
const { transformSync } = require('esbuild');
const Module = require('module');

const projectRoot = path.resolve(__dirname, '..');
const testsDir = path.join(projectRoot, 'tests');

function registerTsLoader() {
  const original = Module._extensions['.ts'];

  Module._extensions['.ts'] = function compile(module, filename) {
    const source = fs.readFileSync(filename, 'utf8');
    const { code } = transformSync(source, {
      loader: 'ts',
      format: 'cjs',
      sourcemap: 'inline',
      target: 'es2020'
    });
    module._compile(code, filename);
  };

  return () => {
    if (original) {
      Module._extensions['.ts'] = original;
    } else {
      delete Module._extensions['.ts'];
    }
  };
}

async function runTests() {
  const cleanup = registerTsLoader();
  try {
    const testFiles = fs
      .readdirSync(testsDir)
      .filter((file) => file.endsWith('.test.ts'))
      .sort();

    if (testFiles.length === 0) {
      console.warn('No test files found under', testsDir);
      return;
    }

    for (const file of testFiles) {
      const testPath = path.join(testsDir, file);
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const mod = require(testPath);
      if (typeof mod.run !== 'function') {
        throw new Error(`Test file ${file} does not export a run() function`);
      }
      await mod.run();
      console.log(`✓ ${file}`);
    }

    console.log(`All ${testFiles.length} test file(s) passed.`);
  } finally {
    cleanup();
  }
}

runTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
