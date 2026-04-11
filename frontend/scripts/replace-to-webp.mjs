import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '../src');

function findJsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findJsxFiles(filePath, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

function replaceWebpImports() {
  const files = findJsxFiles(SRC_DIR);
  let updatedFilesCount = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Regex matches import statements for png, jpg, jpeg coming from assets folder
    // e.g. import logo from "../assets/designer/logo.png";
    const newContent = content.replace(/(import\s+.*?from\s+["'].*?assets\/.*?)\.(png|jpg|jpeg)(["'];)/g, '$1.webp$3');

    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`✅ Updated imports in ${path.relative(SRC_DIR, file)}`);
      updatedFilesCount++;
    }
  }
  
  console.log(`\n🎉 WebP refactoring complete. ${updatedFilesCount} files updated.`);
}

replaceWebpImports();
