const bcrypt = require('bcrypt');
async function main() {
  const h1 = await bcrypt.hash('admin123456', 10);
  const h2 = await bcrypt.hash('123456', 10);
  console.log('ADMIN_HASH=' + h1);
  console.log('USER_HASH=' + h2);
}
main();
