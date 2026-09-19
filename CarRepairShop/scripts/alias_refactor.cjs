const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(srcDir);
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Regex to match imports: import ... from '...' or import '...'
  const importRegex = /(?:import|export)\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;

  content = content.replace(importRegex, (match, importPath) => {
    // Only care about relative paths that go up or are peer folders, wait actually even peer folders can be @/.
    // Let's resolve all relative paths (starting with .)
    if (importPath.startsWith('.')) {
      const currentDir = path.dirname(file);
      const absoluteImportPath = path.resolve(currentDir, importPath);
      
      // If the resolved path is inside srcDir
      if (absoluteImportPath.startsWith(srcDir)) {
        // Find the relative path from srcDir to the imported file
        const relativeToSrc = path.relative(srcDir, absoluteImportPath);
        // Convert to POSIX format (for imports)
        const posixPath = relativeToSrc.split(path.sep).join('/');
        const newImportPath = `@/${posixPath}`;
        
        return match.replace(importPath, newImportPath);
      }
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
});

console.log(`Updated imports in ${changedCount} files.`);
