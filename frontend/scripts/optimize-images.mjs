import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to scan (relative to this script)
const DIRS_TO_SCAN = [
  path.join(__dirname, '../../'), // Workspace Root
  path.join(__dirname, '../src/assets'), // Frontend Assets
  path.join(__dirname, '../src/assets/designer') // Designer Assets
];

async function optimizeImages() {
  console.log('🖼️ Starting Image Optimization Pipeline...');
  
  let totalSavedBytes = 0;
  let optimizedCount = 0;

  for (const dir of DIRS_TO_SCAN) {
    if (!fs.existsSync(dir)) continue;

    console.log(`\n📂 Scanning directory: ${path.resolve(dir)}`);
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const ext = path.extname(file).toLowerCase();

      // Only process files, not directories, and only target PNG/JPG
      if (fs.statSync(filePath).isFile() && (ext === '.png' || ext === '.jpg' || ext === '.jpeg')) {
        const fileNameWithoutExt = path.basename(file, ext);
        const outPath = path.join(dir, `${fileNameWithoutExt}.webp`);

        // Skip if a WebP version already exists
        if (fs.existsSync(outPath)) {
          console.log(`⏭️  Skipping: ${file} (WebP already exists)`);
          continue;
        }

        try {
          const originalSize = fs.statSync(filePath).size;
          
          // Convert to WebP
          await sharp(filePath)
            .webp({ quality: 80, effort: 6 }) // 80% quality is a standard sweet spot for WebP
            .toFile(outPath);

          const newSize = fs.statSync(outPath).size;
          const savedBytes = originalSize - newSize;
          totalSavedBytes += savedBytes;
          optimizedCount++;

          const originalMb = (originalSize / (1024 * 1024)).toFixed(2);
          const newMb = (newSize / (1024 * 1024)).toFixed(2);
          const reductionPercent = ((savedBytes / originalSize) * 100).toFixed(1);

          console.log(`✅ Converted: ${file}`);
          console.log(`   📉 Size Drop: ${originalMb}MB -> ${newMb}MB (-${reductionPercent}%)`);

        } catch (error) {
          console.error(`❌ Failed to process ${file}:`, error.message);
        }
      }
    }
  }

  const savedMb = (totalSavedBytes / (1024 * 1024)).toFixed(2);
  console.log('\n🎉 Optimization Complete!');
  console.log(`🖼️ Total Images Converted: ${optimizedCount}`);
  console.log(`💾 Total Data Saved: ${savedMb} MB`);
}

optimizeImages();
