const axios = require('axios');

async function finalTest() {
    try {
        // Login as test buyer (same credentials your frontend would use)
        const loginResponse = await axios.post('http://localhost:5000/auth/login', {
            email: 'buyer@test.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // Test the buyer location endpoint (the one your frontend was trying to access)
        const locationResponse = await axios.get('http://localhost:5000/buyers/location', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Buyer location endpoint works:');
        console.log('   - Name:', locationResponse.data.full_name);
        console.log('   - Email:', locationResponse.data.email);
        console.log('   - Member since:', locationResponse.data.member_since);
        console.log('   - Location:', locationResponse.data.location);
        
        // Test buyer dashboard endpoint
        const dashboardResponse = await axios.get('http://localhost:5000/buyer/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Buyer dashboard endpoint works');
        
        // Test products endpoint (no auth required)
        const productsResponse = await axios.get('http://localhost:5000/products');
        console.log('✅ Products endpoint works, found', productsResponse.data.length, 'products');
        
        console.log('\n🎉 All endpoints are working correctly!');
        console.log('Your frontend should now be able to access the /buyers/location endpoint without errors.');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

finalTest();
