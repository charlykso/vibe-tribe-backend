// Test script to check what API URL the frontend is using
import dotenv from 'dotenv';
dotenv.config();

console.log('Environment variables:');
console.log('VITE_API_URL:', process.env.VITE_API_URL);

// Test the API URL that would be used
const apiUrl = process.env.VITE_API_URL || 'https://vibe-tribe-backend-8yvp.onrender.com/api/v1';
console.log('API URL that will be used:', apiUrl);

// Test login API call
const testLogin = async () => {
  try {
    console.log('\nTesting login API call...');
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'charlykso121@gmail.com',
        password: 'ikenna123'
      }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (data.success && data.token) {
      console.log('\n✅ Login successful! Testing communities API...');
      
      // Test communities API
      const communitiesResponse = await fetch(`${apiUrl}/communities`, {
        headers: {
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Communities response status:', communitiesResponse.status);
      const communitiesData = await communitiesResponse.json();
      console.log('Communities count:', communitiesData.data?.length || 0);
      
      if (communitiesData.data && communitiesData.data.length > 0) {
        console.log('✅ Communities API working!');
        console.log('First community:', communitiesData.data[0].name);
        
        // Test community members API
        const firstCommunityId = communitiesData.data[0].id;
        const membersResponse = await fetch(`${apiUrl}/communities/${firstCommunityId}/members`, {
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Members response status:', membersResponse.status);
        const membersData = await membersResponse.json();
        console.log('Members count:', membersData.data?.length || 0);
        
        if (membersData.data && membersData.data.length > 0) {
          console.log('✅ Community members API working!');
          console.log('First member:', membersData.data[0].display_name);
        }
      }
    }
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
};

testLogin();
