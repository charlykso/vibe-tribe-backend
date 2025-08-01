import dotenv from 'dotenv';
import { initializeDatabase, getFirestoreClient } from '../services/database.js';

// Load environment variables
dotenv.config();

const checkCommunityMembership = async (): Promise<void> => {
  try {
    console.log('🔍 Checking community membership...');

    // Initialize Firebase connection
    await initializeDatabase();
    console.log('✅ Firebase connection established');

    const firestore = getFirestoreClient();

    // First, find the user charlykso121@gmail.com
    const inviterQuery = await firestore
      .collection('users')
      .where('email', '==', 'charlykso121@gmail.com')
      .limit(1)
      .get();

    if (inviterQuery.empty) {
      console.log('❌ Inviter charlykso121@gmail.com not found in users collection');
      return;
    }

    const inviterUser = inviterQuery.docs[0];
    const inviterData = inviterUser.data();
    console.log('👤 Inviter found:', {
      id: inviterUser.id,
      email: inviterData.email,
      name: inviterData.name,
      organization_id: inviterData.organization_id,
      role: inviterData.role
    });

    // Find all communities in the inviter's organization
    const communitiesQuery = await firestore
      .collection('communities')
      .where('organization_id', '==', inviterData.organization_id)
      .get();

    console.log(`🏘️ Found ${communitiesQuery.docs.length} communities in organization ${inviterData.organization_id}`);

    for (const communityDoc of communitiesQuery.docs) {
      const communityData = communityDoc.data();
      console.log(`\n📍 Community: ${communityData.name} (${communityDoc.id})`);
      console.log(`   Platform: ${communityData.platform}`);
      console.log(`   Member Count: ${communityData.member_count || 0}`);

      // Get all members in this community
      const membersQuery = await firestore
        .collection('community_members')
        .where('community_id', '==', communityDoc.id)
        .get();

      console.log(`   👥 Actual members in database: ${membersQuery.docs.length}`);

      // List all members
      const membersList = [];
      for (const memberDoc of membersQuery.docs) {
        const memberData = memberDoc.data();
        membersList.push({
          username: memberData.username,
          display_name: memberData.display_name,
          email: memberData.email,
          user_id: memberData.user_id,
          platform_user_id: memberData.platform_user_id,
          is_active: memberData.is_active,
          join_date: memberData.join_date,
          metadata: memberData.metadata
        });
      }

      // Sort by join date
      membersList.sort((a, b) => {
        const dateA = a.join_date ? new Date(a.join_date.seconds ? a.join_date.seconds * 1000 : a.join_date) : new Date(0);
        const dateB = b.join_date ? new Date(b.join_date.seconds ? b.join_date.seconds * 1000 : b.join_date) : new Date(0);
        return dateA.getTime() - dateB.getTime();
      });

      console.log('   📋 Members list:');
      membersList.forEach((member, index) => {
        const joinDate = member.join_date ? 
          new Date(member.join_date.seconds ? member.join_date.seconds * 1000 : member.join_date).toLocaleDateString() : 
          'Unknown';
        const invitationAccepted = member.metadata?.invitation_accepted ? '✅ (via invitation)' : '';
        console.log(`      ${index + 1}. ${member.display_name || member.username} (${member.email || 'no email'}) - Joined: ${joinDate} ${invitationAccepted}`);
      });

      // Check specifically for our target users
      const charlykso141 = membersList.find(m => m.username === 'charlykso141' || m.email === 'charlykso141@gmail.com');
      const eventify141 = membersList.find(m => m.username === 'eventify141' || m.email === 'eventify141@gmail.com');
      const charlykso121 = membersList.find(m => m.username === 'charlykso121' || m.email === 'charlykso121@gmail.com');

      console.log(`   🎯 Target users in this community:`);
      console.log(`      charlykso121@gmail.com (inviter): ${charlykso121 ? '✅ Present' : '❌ Missing'}`);
      console.log(`      charlykso141@gmail.com (invitee): ${charlykso141 ? '✅ Present' : '❌ Missing'}`);
      console.log(`      eventify141@gmail.com (invitee): ${eventify141 ? '✅ Present' : '❌ Missing'}`);
    }

    // Also check if there are any invitations for these users
    console.log('\n📧 Checking invitations...');
    const invitationsQuery = await firestore
      .collection('invitations')
      .where('organization_id', '==', inviterData.organization_id)
      .get();

    console.log(`Found ${invitationsQuery.docs.length} invitations in organization`);
    
    const relevantInvitations = [];
    for (const invitationDoc of invitationsQuery.docs) {
      const invitationData = invitationDoc.data();
      if (['charlykso141@gmail.com', 'eventify141@gmail.com'].includes(invitationData.email)) {
        relevantInvitations.push({
          email: invitationData.email,
          status: invitationData.status,
          role: invitationData.role,
          created_at: invitationData.created_at,
          accepted_at: invitationData.accepted_at
        });
      }
    }

    console.log('📋 Relevant invitations:');
    relevantInvitations.forEach(inv => {
      const createdDate = inv.created_at ? 
        new Date(inv.created_at.seconds ? inv.created_at.seconds * 1000 : inv.created_at).toLocaleDateString() : 
        'Unknown';
      const acceptedDate = inv.accepted_at ? 
        new Date(inv.accepted_at.seconds ? inv.accepted_at.seconds * 1000 : inv.accepted_at).toLocaleDateString() : 
        'Not accepted';
      console.log(`   ${inv.email}: ${inv.status} (${inv.role}) - Created: ${createdDate}, Accepted: ${acceptedDate}`);
    });

    console.log('\n✅ Community membership analysis completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Community membership check failed:', error);
    process.exit(1);
  }
};

checkCommunityMembership();
