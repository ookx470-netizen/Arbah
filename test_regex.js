const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
console.log(code.match(/\{\/\* Buttons action layout \*\/\}/));
