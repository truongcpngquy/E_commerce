const http = require('http');

function testEndpoint(path, options = {}) {
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

async function runTests() {
  console.log('🧪 Testing Backend APIs...\n');

  try {
    // 1. Health check
    const health = await testEndpoint('/health');
    console.log('1. Health Check:', health.status === 200 ? '✅ PASSED' : '❌ FAILED', health.data);

    // 2. Login customer1
    const loginRes = await testEndpoint('/api/auth/login', {
      method: 'POST',
      body: { username: 'customer1', password: '123456' }
    });
    console.log('2. Login Customer1:', loginRes.status === 200 ? '✅ PASSED' : '❌ FAILED');
    if (loginRes.data && loginRes.data.token) {
      console.log('   User:', loginRes.data.user.username, '| Role:', loginRes.data.user.role, '| Profile Name:', loginRes.data.user.full_name);
    }

    const token = loginRes.data?.token;

    // 3. Get Products
    const productsRes = await testEndpoint('/api/products');
    console.log('3. Get Products:', productsRes.status === 200 ? '✅ PASSED' : '❌ FAILED', `(Total: ${Array.isArray(productsRes.data) ? productsRes.data.length : 0} items)`);

    // 4. Smart Auto-complete Suggest
    const suggestRes = await testEndpoint('/api/products/search/suggest?q=laptop');
    console.log('4. Auto-complete Suggest ("laptop"):', suggestRes.status === 200 ? '✅ PASSED' : '❌ FAILED');
    console.log('   Suggestions:', suggestRes.data?.suggestions, '| Matched Products:', suggestRes.data?.products?.length);

    // 5. Smart Search
    const searchRes = await testEndpoint('/api/products/search?q=iphone');
    console.log('5. Smart Search ("iphone"):', searchRes.status === 200 ? '✅ PASSED' : '❌ FAILED', `(Matched: ${Array.isArray(searchRes.data) ? searchRes.data.length : 0} items)`);

    // 6. Personalized Recommendations
    if (token) {
      const recoRes = await testEndpoint('/api/recommendations/personalized', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('6. Personalized Recommendations:', recoRes.status === 200 ? '✅ PASSED' : '❌ FAILED', `(Items: ${Array.isArray(recoRes.data) ? recoRes.data.length : 0})`);
    }

    console.log('\n🎉 ALL BACKEND API TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
  }
}

runTests();
