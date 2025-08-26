// scripts/prepare-docker.js
const fs = require('fs');
const path = require('path');

function copySharedToApps() {
  const sharedSrc = path.join(__dirname, '../packages/shared/src');
  const webShared = path.join(__dirname, '../apps/web/src/shared');
  const serverShared = path.join(__dirname, '../apps/server/src/shared');

  console.log('📦 Preparing shared code for Docker...');

  // Copy to web app
  if (!fs.existsSync(webShared)) {
    fs.mkdirSync(webShared, { recursive: true });
  }
  copyRecursive(sharedSrc, webShared);

  // Copy to web app hooks
  const webHooksShared = path.join(__dirname, '../apps/web/src/hooks/shared');
  if (!fs.existsSync(webHooksShared)) {
    fs.mkdirSync(webHooksShared, { recursive: true });
  }
  copyRecursive(sharedSrc, webHooksShared);

  // Copy to server app
  if (!fs.existsSync(serverShared)) {
    fs.mkdirSync(serverShared, { recursive: true });
  }
  copyRecursive(sharedSrc, serverShared);

  console.log('✅ Shared code copied to both apps');
}

function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function updatePackageJson() {
  const webPkgPath = './apps/web/package.json';
  const serverPkgPath = './apps/server/package.json';

  if (fs.existsSync(webPkgPath)) {
    const webPkg = JSON.parse(fs.readFileSync(webPkgPath, 'utf8'));
    if (webPkg.dependencies && webPkg.dependencies['@predictor/shared']) {
      delete webPkg.dependencies['@predictor/shared'];
      fs.writeFileSync(webPkgPath, JSON.stringify(webPkg, null, 2));
    }
  }

  if (fs.existsSync(serverPkgPath)) {
    const serverPkg = JSON.parse(fs.readFileSync(serverPkgPath, 'utf8'));
    if (serverPkg.dependencies && serverPkg.dependencies['@predictor/shared']) {
      delete serverPkg.dependencies['@predictor/shared'];
      fs.writeFileSync(serverPkgPath, JSON.stringify(serverPkg, null, 2));
    }
  }

  console.log('✅ Package.json files updated');
}

function updateImports() {
  // Update imports in source code
  updateImportPaths('./apps/web/src', '@predictor/shared', './shared/index');
  updateImportPaths('./apps/server/src', '@predictor/shared', './shared/index');
}

function updateImportPaths(dir, oldPath, newPath) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      updateImportPaths(filePath, oldPath, newPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(oldPath)) {
        content = content.replace(new RegExp(oldPath, 'g'), newPath);
        fs.writeFileSync(filePath, content);
      }
    }
  }
}

copySharedToApps();
updatePackageJson();
updateImports();
console.log('🎉 Docker preparation complete!');
