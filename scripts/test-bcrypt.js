// FILE: scripts/test-bcrypt.js
// Prueba que bcryptjs está instalado y funciona
const bcrypt = require('bcryptjs');

(async () => {
  const pwd = 'Prueba123!';
  const hash = await bcrypt.hash(pwd, 10);
  const ok = await bcrypt.compare(pwd, hash);
  console.log('hash:', hash);
  console.log('compare ok:', ok);
})();