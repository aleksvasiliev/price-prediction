// scripts/prepare-do.js
const fs = require('fs');
const path = require('path');

function prepareForDO() {
  console.log('🔧 Подготовка для DigitalOcean App Platform...');

  // Копируем shared код
  copySharedToApps();

  // Создаем production package.json файлы
  createProductionPackageJson();

  // Обновляем импорты
  updateImports();

  console.log('✅ Подготовка завершена!');
}

function copySharedToApps() {
  const sharedSrc = path.join(__dirname, '../packages/shared/src');
  const webShared = path.join(__dirname, '../apps/web/src/shared');
  const serverShared = path.join(__dirname, '../apps/server/src/shared');

  // Создаем директории
  if (!fs.existsSync(webShared)) {
    fs.mkdirSync(webShared, { recursive: true });
  }
  if (!fs.existsSync(serverShared)) {
    fs.mkdirSync(serverShared, { recursive: true });
  }

  // Копируем файлы
  copyRecursive(sharedSrc, webShared);
  copyRecursive(sharedSrc, serverShared);

  console.log('📦 Shared код скопирован');
}

function createProductionPackageJson() {
  // Читаем оригинальные файлы
  const webPkg = JSON.parse(fs.readFileSync('./apps/web/package.json', 'utf8'));
  const serverPkg = JSON.parse(fs.readFileSync('./apps/server/package.json', 'utf8'));

  // Удаляем workspace зависимости
  delete webPkg.dependencies['@predictor/shared'];
  delete serverPkg.dependencies['@predictor/shared'];

  // Сохраняем production версии
  fs.writeFileSync('./apps/web/package.prod.json', JSON.stringify(webPkg, null, 2));
  fs.writeFileSync('./apps/server/package.prod.json', JSON.stringify(serverPkg, null, 2));

  console.log('📋 Production package.json созданы');
}

function updateImports() {
  // Обновляем импорты в исходном коде
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

prepareForDO();
