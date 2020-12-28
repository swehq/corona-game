import {execSync} from 'child_process';
import {openSync, writeSync} from 'fs';

/**
 * Run via npm, pass [env] as environment
 */
const commit = execSync('git rev-parse --short HEAD')
  .toString()
  .trim();
const buildDate = new Date();
const build = `{
  commit: '${commit}',
  buildTime: '${buildDate.toISOString()}',
  env: '${process.argv[2] || 'local'}',
}`;

const file = openSync('src/environments/version.ts', 'w');
writeSync(file, `export const build = ${build};\n`);

const jsonFile = openSync('src/assets/version.json', 'w');
writeSync(jsonFile, JSON.stringify({c: commit}));
