import { searchCatalog } from '../services/catalogService.js';

async function test() {
  try {
    const res = await searchCatalog({ q: '', branchId: null, availableOnly: false });
    console.log('SUCCESS! Loaded actual books:', res.length);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
test();
