const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(/key=\{u\.phone \|\| u\.id\}/g, "key={u.phone || u.id || Math.random()}");
code = code.replace(/key=\{u\.id \|\| u\.phone\}/g, "key={u.phone || u.id || Math.random()}");

fs.writeFileSync('src/components/AdminPanel.tsx', code);
