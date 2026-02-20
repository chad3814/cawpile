/**
 * Monorepo integrity tests.
 * Verifies the workspace structure, package resolution, and build correctness.
 */
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SHARED_PKG = path.join(ROOT, 'packages', 'shared');
const WEB_PKG = path.join(ROOT, 'apps', 'web');

describe('Monorepo Integrity', () => {
  it('packages/shared compiles and exports types correctly', () => {
    // Verify the shared package dist exists (built by npm run build -w packages/shared)
    const distIndex = path.join(SHARED_PKG, 'dist', 'index.js');
    const distTypes = path.join(SHARED_PKG, 'dist', 'index.d.ts');

    expect(existsSync(distIndex)).toBe(true);
    expect(existsSync(distTypes)).toBe(true);

    // Verify the dist files contain actual exported utilities and types
    const jsContent = readFileSync(distIndex, 'utf-8');
    expect(jsContent).toContain('FICTION_FACETS');
    expect(jsContent).toContain('calculateCawpileAverage');
    expect(jsContent).toContain('detectBookType');

    const dtsContent = readFileSync(distTypes, 'utf-8');
    expect(dtsContent).toContain('BookStatus');
    expect(dtsContent).toContain('CawpileRating');
    expect(dtsContent).toContain('DashboardBookData');
  });

  it('apps/web can import from @cawpile/shared', () => {
    // Verify the workspace link exists in node_modules
    const sharedInWebNodeModules = path.join(ROOT, 'node_modules', '@cawpile', 'shared');
    expect(existsSync(sharedInWebNodeModules)).toBe(true);

    // Verify the package.json has the workspace dependency
    const webPkg = JSON.parse(readFileSync(path.join(WEB_PKG, 'package.json'), 'utf-8'));
    expect(webPkg.dependencies['@cawpile/shared']).toBeDefined();
  });

  it('apps/web TypeScript compilation succeeds with new path references', () => {
    // Verify the tsconfig has the @cawpile/shared path alias and reference
    const tsconfig = JSON.parse(readFileSync(path.join(WEB_PKG, 'tsconfig.json'), 'utf-8'));

    expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['./src/*']);
    expect(tsconfig.compilerOptions.paths['@cawpile/shared']).toBeDefined();
    expect(tsconfig.references).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '../../packages/shared' }),
      ])
    );
  });

  it('root workspace commands proxy correctly to sub-packages', () => {
    // Verify the root package.json has workspace config
    const rootPkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

    expect(rootPkg.workspaces).toEqual(
      expect.arrayContaining(['apps/*', 'packages/*', 'services/*'])
    );

    // Verify proxy scripts exist
    expect(rootPkg.scripts.dev).toContain('-w apps/web');
    expect(rootPkg.scripts.test).toContain('-w apps/web');
    expect(rootPkg.scripts.lint).toContain('-w apps/web');
    expect(rootPkg.scripts['test:video-gen']).toContain('-w services/video-gen');
  });
});
