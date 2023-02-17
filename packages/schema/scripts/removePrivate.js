const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.resolve(__dirname, '../dist/index.d.ts'), 'utf-8');
content = content.replace(/\s+(private|protected).+;/g, '');
content = require('./copyright') + '\n' + content + '\n\n';

// let global = fs.readFileSync(path.resolve(__dirname, '../src/global.d.ts'), 'utf-8');
// content += `declare global{\n${global.split('\n').map(v=>'\t'+v).join('\n')}\n}`

fs.writeFileSync(path.resolve(__dirname, '../dist/index.d.ts'), content, 'utf-8');