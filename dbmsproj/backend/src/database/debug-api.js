// No imports needed
// Let's write a simple fetch call using native node-fetch/undici:
async function debug() {
  try {
    const url = 'https://library-management-system-qyp2.onrender.com/api/catalog/books';
    console.log('Fetching from URL:', url);
    const res = await fetch(url);
    const json = await res.json();
    console.log('Response status:', res.status);
    console.log('Response body:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
debug();
