const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'extension');
const outDir = path.join(__dirname, '..', 'dist');

// Read manifest to determine version-based folder name
let version = '0.0.0';
try {
  const manifestPath = path.join(srcDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const mf = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (mf && mf.version) version = mf.version;
  }
} catch (err) {
  console.warn('Could not read manifest version, using unknown:', err.message);
}

const versionedOutDir = path.join(outDir, `quickfill-release-v${version}`);

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else if (stats.isFile()) {
    fs.copyFileSync(src, dest);
  }
}

// Copy src/extension -> dist/versioned folder
if (!fs.existsSync(srcDir)) {
  console.error('Source extension directory not found:', srcDir);
  process.exit(1);
}

// Ensure dist exists
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// If a versioned folder already exists, replace it
if (fs.existsSync(versionedOutDir)) {
  fs.rmSync(versionedOutDir, { recursive: true, force: true });
}

// Create versioned folder and copy into it
copyRecursive(srcDir, versionedOutDir);
// Also copy top-level icons and samples if present so dist contains needed assets
const root = path.join(__dirname, '..');
const iconsSrc = path.join(root, 'icons');
const samplesSrc = path.join(root, 'samples');
if (fs.existsSync(iconsSrc)) {
  copyRecursive(iconsSrc, path.join(versionedOutDir, 'icons'));
}
if (fs.existsSync(samplesSrc)) {
  copyRecursive(samplesSrc, path.join(versionedOutDir, 'samples'));
}

console.log('Extension copied to', versionedOutDir);
