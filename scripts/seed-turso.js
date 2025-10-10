require('dotenv').config({ path: '.env.local' });

// Verify Turso credentials are loaded
console.log('Environment check:');
console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN ? '✅ Set' : '❌ Missing');

// Dynamic import since we're using CommonJS here
(async () => {
  const { seedDatabase } = await import('../src/lib/seed.js');
  
  console.log('\n🌱 Seeding Turso database...');
  
  await seedDatabase();
  
  console.log('✅ Turso database seeded successfully!');
  process.exit(0);
})().catch((error) => {
  console.error('❌ Error seeding database:', error);
  process.exit(1);
});
