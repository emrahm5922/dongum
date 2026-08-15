const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, 'www');

// Clean and recreate www directory
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    // Ignore heavy folders and artifacts
    if (element === 'node_modules' || element === 'android' || element === 'ios' || element === 'www' || element === '.git' || element === '.github' || element === 'scripts' || element === '.system_generated') return;
    if (element.endsWith('.apk') || element.endsWith('.zip') || element.endsWith('.tar.gz') || element.endsWith('.log')) return;
    
    const srcPath = path.join(from, element);
    const dstPath = path.join(to, element);
    const stat = fs.lstatSync(srcPath);

    if (stat.isFile()) {
      fs.copyFileSync(srcPath, dstPath);
    } else if (stat.isDirectory()) {
      copyFolderSync(srcPath, dstPath);
    }
  });
}

console.log('📦 Web varlıkları www/ klasörüne temizlenerek kopyalanıyor...');
copyFolderSync(rootDir, outDir);
console.log('✅ www/ klasörü başarıyla optimize edildi!');
