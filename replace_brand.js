const fs = require('fs');
const path = require('path');

const dirsToSearch = [
  path.join(__dirname, 'apps/web/app'),
  path.join(__dirname, 'apps/web/components')
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

let allFiles = [];
dirsToSearch.forEach(dir => {
  if (fs.existsSync(dir)) {
    allFiles = allFiles.concat(walk(dir));
  }
});

let modifiedCount = 0;

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/\bLKW\b/g, 'LKWA');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
    modifiedCount++;
  }
});

console.log(`Total files modified: ${modifiedCount}`);
