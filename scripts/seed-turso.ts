import { seedDatabase } from '../src/lib/seed';

console.log('🌱 Seeding Turso database...');

seedDatabase()
  .then(() => {
    console.log('✅ Turso database seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  });
