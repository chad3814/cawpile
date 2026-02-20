#!/usr/bin/env node
/**
 * Copies @testing-library packages into video-gen's local node_modules
 * so they resolve react-dom from the local React 18 instead of the
 * hoisted React 19 at the monorepo root.
 *
 * This is necessary because npm workspaces hoists @testing-library/react
 * to root where it sees React 19's react-dom, causing version conflicts.
 */
const { cpSync, existsSync, mkdirSync } = require('fs');
const path = require('path');

const localModules = path.resolve(__dirname, '..', 'node_modules');
const rootModules = path.resolve(__dirname, '..', '..', '..', 'node_modules');

const packages = ['@testing-library/react', '@testing-library/dom'];

for (const pkg of packages) {
  const rootPkg = path.join(rootModules, pkg);
  const localPkg = path.join(localModules, pkg);

  if (existsSync(rootPkg) && !existsSync(localPkg)) {
    const parentDir = path.dirname(localPkg);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }
    cpSync(rootPkg, localPkg, { recursive: true });
    console.log(`[fix-testing-library] Copied ${pkg} to local node_modules`);
  }
}
