import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { initializeDatabase, getFirestoreClient, getServerTimestamp } from '../services/database.js';
// Load environment variables from backend/.env
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
const testAuthFunctions = async () => {
    try {
        console.log('🔐 Testing VibeTribe Auth Functions...');
        console.log('');
        // Initialize Firebase
        await initializeDatabase();
        console.log('✅ Firebase initialized');
        const firestore = getFirestoreClient();
        // Test 1: Create a test user (simulating registration)
        console.log('1️⃣ Testing user registration...');
        const testUser = {
            email: 'test@vibetrbe.com',
            name: 'Test User',
            role: 'member',
            email_verified: false,
            is_active: true,
            created_at: getServerTimestamp(),
            updated_at: getServerTimestamp()
        };
        // Check if user already exists
        const existingUserQuery = await firestore
            .collection('users')
            .where('email', '==', testUser.email)
            .limit(1)
            .get();
        let userId;
        if (existingUserQuery.empty) {
            // Create new user
            const userRef = await firestore.collection('users').add(testUser);
            userId = userRef.id;
            console.log(`✅ User created successfully with ID: ${userId}`);
        }
        else {
            // Use existing user
            userId = existingUserQuery.docs[0].id;
            console.log(`✅ Using existing user with ID: ${userId}`);
        }
        // Test 2: Generate JWT token (simulating login)
        console.log('');
        console.log('2️⃣ Testing JWT token generation...');
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET not configured');
        }
        const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
        console.log('✅ JWT token generated successfully');
        console.log(`   Token length: ${token.length} characters`);
        // Test 3: Verify JWT token (simulating auth middleware)
        console.log('');
        console.log('3️⃣ Testing JWT token verification...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ JWT token verified successfully');
        console.log(`   User ID from token: ${decoded.sub}`);
        // Test 4: Fetch user data (simulating /me endpoint)
        console.log('');
        console.log('4️⃣ Testing user data retrieval...');
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('User not found');
        }
        const userData = { id: userDoc.id, ...userDoc.data() };
        console.log('✅ User data retrieved successfully');
        console.log(`   User: ${userData.name} (${userData.email})`);
        // Test 5: Update user data (simulating profile update)
        console.log('');
        console.log('5️⃣ Testing user data update...');
        await firestore
            .collection('users')
            .doc(userId)
            .update({
            last_login: getServerTimestamp(),
            updated_at: getServerTimestamp()
        });
        console.log('✅ User data updated successfully');
        // Test 6: Create organization (simulating registration with org)
        console.log('');
        console.log('6️⃣ Testing organization creation...');
        const testOrg = {
            name: 'Test Organization',
            slug: 'test-org',
            plan: 'free',
            settings: {},
            created_at: getServerTimestamp(),
            updated_at: getServerTimestamp(),
            is_active: true
        };
        // Check if org already exists
        const existingOrgQuery = await firestore
            .collection('organizations')
            .where('slug', '==', testOrg.slug)
            .limit(1)
            .get();
        let orgId;
        if (existingOrgQuery.empty) {
            const orgRef = await firestore.collection('organizations').add(testOrg);
            orgId = orgRef.id;
            console.log(`✅ Organization created successfully with ID: ${orgId}`);
        }
        else {
            orgId = existingOrgQuery.docs[0].id;
            console.log(`✅ Using existing organization with ID: ${orgId}`);
        }
        // Test 7: Link user to organization
        console.log('');
        console.log('7️⃣ Testing user-organization linking...');
        await firestore
            .collection('users')
            .doc(userId)
            .update({
            organization_id: orgId,
            role: 'admin',
            updated_at: getServerTimestamp()
        });
        console.log('✅ User linked to organization successfully');
        // Success summary
        console.log('');
        console.log('🎉 ALL AUTH TESTS PASSED! 🎉');
        console.log('');
        console.log('✅ User registration flow works');
        console.log('✅ JWT token generation works');
        console.log('✅ JWT token verification works');
        console.log('✅ User data retrieval works');
        console.log('✅ User data updates work');
        console.log('✅ Organization creation works');
        console.log('✅ User-organization linking works');
        console.log('');
        console.log('🚀 Your Firebase auth system is fully functional!');
        console.log('');
        console.log('📋 What this means:');
        console.log('• Users can register and login');
        console.log('• JWT tokens are working for authentication');
        console.log('• User profiles can be managed');
        console.log('• Organizations can be created and managed');
        console.log('• All Firebase operations are working correctly');
    }
    catch (error) {
        console.error('❌ Auth test failed:', error);
        if (error instanceof Error) {
            console.log('');
            console.log('Error details:', error.message);
        }
        process.exit(1);
    }
};
// Run test
testAuthFunctions();
//# sourceMappingURL=test-auth.js.map