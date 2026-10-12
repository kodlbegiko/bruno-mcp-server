import { getAllCards } from '../src/data/cards/registry';
import { assertCardDatabase } from '../src/data/cards/validation';

console.log('🔍 Validating Deeply Know Someone card database...');

const cards = getAllCards();
const report = assertCardDatabase(cards, 130);

console.log(`📦 Total cards: ${report.total}`);
console.log('📊 Level breakdown:');
for (const [level, count] of Object.entries(report.levelBreakdown)) {
  console.log(`   - ${level}: ${count} cards`);
}

if (!report.valid) {
  console.error('\n❌ Card database validation failed with errors:');
  for (const err of report.errors) {
    console.error(`   • ${err}`);
  }
  process.exit(1);
}

console.log('\n✅ All 130 cards passed content integrity and metadata validation!');
