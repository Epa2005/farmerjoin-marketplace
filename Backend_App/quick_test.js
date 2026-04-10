const axios = require('axios');
const FormData = require('form-data');

async function quickTest() {
    try {
        console.log('🔍 Quick test of add product endpoint...');
        
        // Create a valid JWT token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { user_id: 16, role: 'farmer', email: 'farmer@test.com' },
            'secretkey',
            { expiresIn: '1h' }
        );
        
        console.log('✅ Token created');
        
        // Test with FormData (exactly like frontend)
        const formData = new FormData();
        formData.append('product_name', 'fresh maize');
        formData.append('category', 'Grains');
        formData.append('price', '500');
        formData.append('quantity', '800000');
        formData.append('description', 'Fresh maize from farm');
        
        // Add mock image
        const mockImage = Buffer.from('fake image content');
        formData.append('image', mockImage, {
            filename: 'image1.jpg',
            contentType: 'image/jpeg'
        });
        
        console.log('📤 Sending product data...');
        
        const response = await axios.post('http://localhost:5000/farmer/products', formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        
        console.log('✅ SUCCESS! Product added:');
        console.log('Product ID:', response.data.product_id);
        console.log('Message:', response.data.message);
        console.log('Product details:', response.data.product);
        
        console.log('\n🎉 The add product endpoint is now working!');
        console.log('✅ No more 500 errors');
        console.log('✅ Farmers can add products successfully');
        
    } catch (error) {
        console.log('❌ Test failed:');
        console.log('Status:', error.response?.status);
        console.log('Data:', error.response?.data);
        console.log('Message:', error.message);
    }
}

quickTest();
