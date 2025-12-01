require('dotenv').config();
const { sendPendingReviewInvites } = require('../src/utils/reviewCron');

console.log('🚀 Enviando correos de invitación a reseñas...\n');

sendPendingReviewInvites()
  .then(() => {
    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
