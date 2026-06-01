import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const distDir = './dist';

function processDir(dir) {
  const files = readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(dir, file.name);

    if (file.isDirectory()) {
      processDir(fullPath);
    } else if (file.name.endsWith('.js')) {
      let content = readFileSync(fullPath, 'utf-8');

      // Add .js to relative imports that don't already have it
      content = content.replace(
        /from\s+["'](\.[^"']+)(?<!\.js)["']/g,
        'from "$1.js"'
      );

      writeFileSync(fullPath, content, 'utf-8');
    }
  }
}

processDir(distDir);
console.log('✓ Added .js extensions to relative imports');
