import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../src/pages');

function replaceBlock(file, targetRegex, replacement, importStatement) {
  const filePath = path.join(srcDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Inject import
  if (importStatement && !content.includes(importStatement.split(' ')[1])) {
    content = content.replace(
      'import StatusView from "../components/StatusView";',
      `import StatusView from "../components/StatusView";\n${importStatement}`
    );
  }

  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
}

function processCheckout() {
  replaceBlock(
    'CheckoutAddress.jsx',
    /if\s*\(isLoading\s*\|\|\s*!hasActiveSession\)\s*\{\s*return\s*\(\s*<section className="container-shell.*?>\s*<div.*?>\s*<div.*?>\s*<CheckoutSkeleton.*?\/>\s*<\/div>\s*<\/div>\s*<\/section>\s*\);\s*\}/s,
    `if (isLoading || !hasActiveSession) {
    return (
      <section className="container-shell py-10 sm:py-12">
        <CheckoutSkeleton />
      </section>
    );
  }`,
    'import CheckoutSkeleton from "../components/CheckoutSkeleton";'
  );

  replaceBlock(
    'CheckoutPayment.jsx',
    /if\s*\(isLoading\s*\|\|\s*!hasActiveSession\)\s*\{\s*return\s*\(\s*<section className="container-shell.*?>\s*<div.*?>\s*<div.*?>\s*<CheckoutSkeleton.*?\/>\s*<\/div>\s*<\/div>\s*<\/section>\s*\);\s*\}/s,
    `if (isLoading || !hasActiveSession) {
    return (
      <section className="container-shell py-10 sm:py-12">
        <CheckoutSkeleton />
      </section>
    );
  }`,
    'import CheckoutSkeleton from "../components/CheckoutSkeleton";'
  );
}

processCheckout();
