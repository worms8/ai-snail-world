/**
 * Documentation and structure gate.
 *
 * Verifies:
 * 1. every src module folder has MODULE.md
 * 2. MODULE.md files stay <= 60 lines, AGENTS.md <= 150
 * 3. no source file exceeds 300 lines
 * 4. ARCHITECTURE.md file map mentions every module folder
 * 5. dependency-cruiser rules pass
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const SOURCE_DIRS = ['src', 'server', 'scripts', 'tests'];
const failures: string[] = [];

function fail(message: string): void {
  failures.push(message);
}

function linesOf(path: string): number {
  return readFileSync(path, 'utf8').split(/\r?\n/).length;
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

// 1 + 2: module docs
const modules = readdirSync(join(ROOT, 'src'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const moduleName of modules) {
  const moduleDir = join(ROOT, 'src', moduleName);
  const moduleDoc = join(moduleDir, 'MODULE.md');
  if (!existsSync(moduleDoc)) {
    fail(`src/${moduleName}/ is missing MODULE.md`);
    continue;
  }
  const count = linesOf(moduleDoc);
  if (count > 60) fail(`src/${moduleName}/MODULE.md has ${count} lines (max 60)`);
}

if (!existsSync(join(ROOT, 'server', 'MODULE.md'))) fail('server/MODULE.md is missing');

const agentsPath = join(ROOT, 'AGENTS.md');
if (!existsSync(agentsPath)) {
  fail('AGENTS.md is missing');
} else if (linesOf(agentsPath) > 150) {
  fail(`AGENTS.md has ${linesOf(agentsPath)} lines (max 150)`);
}

// 3: source file size
for (const dir of SOURCE_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    if (!/\.(ts|tsx|js|jsx)$/.test(file)) continue;
    const count = linesOf(file);
    if (count > 300) fail(`${relative(ROOT, file)} has ${count} lines (hard max 300)`);
  }
}

// 4: architecture file map
const architecturePath = join(ROOT, 'ARCHITECTURE.md');
if (!existsSync(architecturePath)) {
  fail('ARCHITECTURE.md is missing');
} else {
  const architecture = readFileSync(architecturePath, 'utf8');
  for (const moduleName of modules) {
    if (!architecture.includes(`src/${moduleName}/`)) {
      fail(`ARCHITECTURE.md does not list src/${moduleName}/`);
    }
  }
  if (!architecture.includes('server/')) fail('ARCHITECTURE.md does not list server/');
}

// 5: dependency rules
const depcruiseBin = join(
  ROOT,
  'node_modules',
  'dependency-cruiser',
  'bin',
  'dependency-cruiser.mjs',
);
if (!existsSync(depcruiseBin)) {
  fail('dependency-cruiser is not installed; run npm install');
} else {
  const result = spawnSync(
    process.execPath,
    [depcruiseBin, 'src', 'server', '--config', '.dependency-cruiser.cjs'],
    { cwd: ROOT, stdio: 'inherit' },
  );
  if (result.status !== 0) fail('dependency-cruiser reported violations');
}

if (failures.length > 0) {
  console.error('\ndocs:check FAILED');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `docs:check passed (${modules.length} modules, source files <= 300 lines, deps clean)`,
  );
}
