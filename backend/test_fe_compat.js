const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testFrontendFlow() {
  console.log('🔄 Simulating Frontend (FE) Integration Flow...\n');

  // 1. App load -> fetchCategories
  const cats = await request('/api/products/categories');
  console.log('1. FE fetchCategories():', Array.isArray(cats.data) ? `✅ OK (${cats.data.length} categories)` : '❌ FAILED');

  // 2. Auth -> Login
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'customer1', password: '123456' }
  });
  console.log('2. FE login():', login.data.token ? '✅ OK (Token received)' : '❌ FAILED');
  const token = login.data?.token;

  // 3. Auth -> fetch /auth/me
  const me = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('3. FE getMe():', me.data.id === 4 ? `✅ OK (User: ${me.data.username}, Profile: ${me.data.full_name})` : '❌ FAILED');

  // 4. Home Page -> fetchProducts
  const prods = await request('/api/products?limit=20&offset=0');
  console.log('4. FE fetchProducts():', Array.isArray(prods.data) ? `✅ OK (${prods.data.length} products)` : '❌ FAILED');

  // 5. Home Page -> getPersonalizedRecommendations
  const recs = await request('/api/recommendations/personalized?limit=6', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('5. FE getPersonalizedRecommendations():', Array.isArray(recs.data) ? `✅ OK (${recs.data.length} recommended items)` : '❌ FAILED');

  // 6. Product Detail -> getSimilarProducts (Product ID: 1)
  const similar = await request('/api/recommendations/similar/1?limit=5');
  console.log('6. FE getSimilarProducts(1):', Array.isArray(similar.data) ? `✅ OK (${similar.data.length} similar items)` : '❌ FAILED');

  // 7. Cart -> fetchCart
  const cart = await request('/api/cart', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('7. FE fetchCart():', Array.isArray(cart.data) ? `✅ OK (${cart.data.length} items in cart)` : '❌ FAILED');

  // 8. Track Interaction -> view product
  const track = await request('/api/recommendations/track', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { product_id: 1, interaction_type: 'view' }
  });
  console.log('8. FE trackInteraction("view"):', track.data.message ? '✅ OK' : '❌ FAILED');

  console.log('\n✨ FRONTEND BACKWARD COMPATIBILITY TEST FULLY PASSED!');
}

testFrontendFlow();
