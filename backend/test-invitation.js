// Test invitation email sending
import fetch from 'node-fetch';

async function testInvitation() {
  console.log('🧪 Testing invitation email sending...');
  
  try {
    // First, let's check if the server is running
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('✅ Server health:', healthData.message);
    
    // Test sending an invitation (this will require authentication)
    // For now, let's just test the email service directly
    console.log('📧 Testing email service through invitation endpoint...');
    
    // Note: This will fail without proper authentication, but we should see email logs
    const inviteResponse = await fetch('http://localhost:3001/api/v1/invitations/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        role: 'member',
        message: 'Test invitation'
      })
    });
    
    console.log('📧 Invitation response status:', inviteResponse.status);
    const responseText = await inviteResponse.text();
    console.log('📧 Invitation response:', responseText);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInvitation();
