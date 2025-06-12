import admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

let db: Firestore;

// Mock Firestore for development
const createMockFirestore = () => {
  const collections = new Map<string, Map<string, any>>();

  const mockQuery = async (collectionName: string, filters: any[] = []) => {
    const collection = collections.get(collectionName) || new Map();
    let results = Array.from(collection.values());

    // Apply basic filtering (simplified)
    filters.forEach(filter => {
      if (filter.operator === '==') {
        results = results.filter(doc => doc[filter.field] === filter.value);
      } else if (filter.operator === '>=') {
        results = results.filter(doc => doc[filter.field] >= filter.value);
      } else if (filter.operator === '<=') {
        results = results.filter(doc => doc[filter.field] <= filter.value);
      }
    });

    return {
      docs: results.map(data => ({
        id: data.id,
        data: () => data,
        exists: true
      })),
      size: results.length,
      empty: results.length === 0
    };
  };

  return {
    collection: (name: string) => {
      if (!collections.has(name)) {
        collections.set(name, new Map());
      }

      return {
        add: async (data: any) => {
          const id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const collection = collections.get(name)!;
          collection.set(id, { ...data, id });

          return {
            id,
            get: async () => ({
              id,
              exists: true,
              data: () => ({ ...data, id })
            })
          };
        },

        doc: (id: string) => ({
          get: async () => {
            const collection = collections.get(name)!;
            const data = collection.get(id);
            return {
              id,
              exists: !!data,
              data: () => data || null
            };
          },

          update: async (updates: any) => {
            const collection = collections.get(name)!;
            const existing = collection.get(id) || {};
            collection.set(id, { ...existing, ...updates, id });
            return { id };
          },

          set: async (data: any) => {
            const collection = collections.get(name)!;
            collection.set(id, { ...data, id });
            return { id };
          },

          delete: async () => {
            const collection = collections.get(name)!;
            collection.delete(id);
            return { id };
          }
        }),

        where: (field: string, operator: string, value: any) => ({
          where: (field2: string, operator2: string, value2: any) => ({
            where: (field3: string, operator3: string, value3: any) => ({
              orderBy: () => ({ limit: () => ({ offset: () => ({ get: () => mockQuery(name, [{ field, operator, value }, { field: field2, operator: operator2, value: value2 }, { field: field3, operator: operator3, value: value3 }]) }), get: () => mockQuery(name, [{ field, operator, value }, { field: field2, operator: operator2, value: value2 }, { field: field3, operator: operator3, value: value3 }]) }), get: () => mockQuery(name, [{ field, operator, value }, { field: field2, operator: operator2, value: value2 }, { field: field3, operator: operator3, value: value3 }]) }),
              limit: () => ({ offset: () => ({ get: () => mockQuery(name, [{ field, operator, value }, { field: field2, operator: operator2, value: value2 }, { field: field3, operator: operator3, value: value3 }]) }), get: () => mockQuery(name, [{ field, operator, value }, { field: field2, operator: operator2, value: value2 }, { field: field3, operator: operator3, value: value3 }]) }),
              get: () => mockQuery(name, [{ field, operator, value }, { field: field2, operator: operator2, value: value2 }, { field: field3, operator: operator3, value: value3 }])
            }),
            orderBy: () => ({ limit: () => ({ offset: () => ({ get: () => mockQuery(name, [{ field, operator, value }, { field: field2, operator: operator2, value: value2 }]) }), get: () => mockQuery(name, [{ field, operator, value }, { field: field2, operator: operator2, value: value2 }]) }), get: () => mockQuery(name, [{ field, operator, value }, { field: field2, operator: operator2, value: value2 }]) }),
            limit: () => ({ offset: () => ({ get: () => mockQuery(name, [{ field, operator, value }, { field: field2, operator: operator2, value: value2 }]) }), get: () => mockQuery(name, [{ field, operator, value }, { field: field2, operator: operator2, value: value2 }]) }),
            get: () => mockQuery(name, [{ field, operator, value }, { field: field2, operator: operator2, value: value2 }])
          }),
          orderBy: () => ({ limit: () => ({ offset: () => ({ get: () => mockQuery(name, [{ field, operator, value }]) }), get: () => mockQuery(name, [{ field, operator, value }]) }), get: () => mockQuery(name, [{ field, operator, value }]) }),
          limit: () => ({ offset: () => ({ get: () => mockQuery(name, [{ field, operator, value }]) }), get: () => mockQuery(name, [{ field, operator, value }]) }),
          get: () => mockQuery(name, [{ field, operator, value }])
        }),

        orderBy: () => ({ limit: () => ({ offset: () => ({ get: () => mockQuery(name, []) }), get: () => mockQuery(name, []) }), get: () => mockQuery(name, []) }),
        limit: () => ({ offset: () => ({ get: () => mockQuery(name, []) }), get: () => mockQuery(name, []) }),
        get: () => mockQuery(name, [])
      };
    }
  };
};

export const initializeDatabase = async (): Promise<void> => {
  try {

    // Check if Firebase Admin is already initialized
    if (admin.apps.length === 0) {
      // Try to use complete Firebase service account JSON first
      let serviceAccount: any = null;

      // Method 1: Complete Firebase service account JSON (Base64 encoded - PREFERRED for production)
      const firebaseServiceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      if (firebaseServiceAccountBase64) {
        try {
          console.log('🔄 Attempting to use Firebase service account Base64...');
          const serviceAccountJson = Buffer.from(firebaseServiceAccountBase64, 'base64').toString('utf8');
          serviceAccount = JSON.parse(serviceAccountJson);
          console.log('✅ Using complete Firebase service account JSON (Base64)');
        } catch (error) {
          console.error('❌ Failed to parse Firebase service account JSON:', error.message);
          console.log('⚠️ Falling back to individual environment variables...');
        }
      }

      // Method 2: Individual environment variables (fallback)
      if (!serviceAccount) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

        if (projectId && clientEmail) {
          console.log('✅ Using individual Firebase environment variables');
          // Handle private key formatting for different environments
          let privateKey = process.env.FIREBASE_PRIVATE_KEY;

          // Try Base64 encoded key first (safer for environment variables)
          const base64Key = process.env.FIREBASE_PRIVATE_KEY_BASE64;
          if (base64Key) {
            try {
              privateKey = Buffer.from(base64Key, 'base64').toString('utf8');
              console.log('✅ Using Base64 encoded private key');
            } catch (error) {
              console.warn('Failed to decode Base64 private key, falling back to regular key');
            }
          }

          if (privateKey) {
            // Remove any surrounding quotes
            privateKey = privateKey.replace(/^["']|["']$/g, '');

            // Replace escaped newlines with actual newlines
            privateKey = privateKey.replace(/\\n/g, '\n');

            // Only try to decode as Base64 if it doesn't look like a PEM key
            // and doesn't contain newlines (which would indicate it's already formatted)
            if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') &&
                !privateKey.includes('\n') &&
                privateKey.length > 100) {
              try {
                const decoded = Buffer.from(privateKey, 'base64').toString('utf8');
                // Verify the decoded content looks like a PEM key
                if (decoded.includes('-----BEGIN PRIVATE KEY-----')) {
                  privateKey = decoded;
                  console.log('✅ Successfully decoded Base64 private key');
                }
              } catch (error) {
                console.warn('Private key is not Base64 encoded, using as-is');
              }
            }
          }

          serviceAccount = {
            type: "service_account",
            project_id: projectId,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: privateKey,
            client_email: clientEmail,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
            token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
          };
        } else {
          console.error('⚠️ Missing individual Firebase credentials and no Base64 service account available');
        }
      }

      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        console.error('❌ Missing Firebase configuration:');
        console.error('  - Project ID:', !!serviceAccount.project_id);
        console.error('  - Private Key:', !!serviceAccount.private_key, serviceAccount.private_key ? `(${serviceAccount.private_key.length} chars)` : '');
        console.error('  - Client Email:', !!serviceAccount.client_email);
        throw new Error('Missing Firebase configuration. Please check your environment variables.');
      }

      // Debug private key format
      if (serviceAccount.private_key) {
        const lines = serviceAccount.private_key.split('\n');
        console.log('🔧 Firebase config loaded:');
        console.log('  - Project ID:', serviceAccount.project_id);
        console.log('  - Client Email:', serviceAccount.client_email);
        console.log('  - Private Key: Present (' + serviceAccount.private_key.length + ' chars)');
        console.log('  - Private Key contains newlines:', serviceAccount.private_key.includes('\n'));
        console.log('  - Private Key line count:', lines.length);
        console.log('  - First line: "' + lines[0] + '"');
        console.log('  - Last line: "' + lines[lines.length - 1] + '"');

        // Validate the private key format
        if (!lines[0].includes('-----BEGIN PRIVATE KEY-----')) {
          console.error('❌ Private key does not start with BEGIN marker!');
          console.error('  - Actual first line:', JSON.stringify(lines[0]));
        }
        if (!lines[lines.length - 1].includes('-----END PRIVATE KEY-----')) {
          console.error('❌ Private key does not end with END marker!');
          console.error('  - Actual last line:', JSON.stringify(lines[lines.length - 1]));
        }

        // Additional validation - check for common issues
        const keyContent = lines.slice(1, -1).join('');
        console.log('  - Key content length (without headers):', keyContent.length);
        console.log('  - Key content sample:', keyContent.substring(0, 50) + '...');

        // Check if the key content is valid base64
        try {
          Buffer.from(keyContent, 'base64');
          console.log('  - Key content is valid base64: ✅');
        } catch (error) {
          console.error('  - Key content is NOT valid base64: ❌', error.message);
        }

        // Debug the complete service account object
        console.log('🔍 Complete service account object:');
        console.log('  - type:', serviceAccount.type);
        console.log('  - project_id:', serviceAccount.project_id);
        console.log('  - private_key_id:', serviceAccount.private_key_id);
        console.log('  - client_email:', serviceAccount.client_email);
        console.log('  - client_id:', serviceAccount.client_id);
        console.log('  - auth_uri:', serviceAccount.auth_uri);
        console.log('  - token_uri:', serviceAccount.token_uri);
      } else {
        console.error('❌ Private key is missing!');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }

    // Initialize Firestore
    db = getFirestore();

    // Test the connection by trying to read from a collection
    await db.collection('_health_check').limit(1).get();

    console.log('✅ Firebase Firestore connection established successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase database:', error);
    throw error;
  }
};

export const getFirestoreClient = (): Firestore => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

// Export db instance for direct access
export { db };

// Firebase Auth integration
export const getFirebaseAuth = (): admin.auth.Auth => {
  return admin.auth();
};

// Helper function to create collections with initial setup
export const initializeCollections = async (): Promise<void> => {
  const firestore = getFirestoreClient();

  try {
    // Create initial collections with sample documents to establish structure
    const collections = [
      'organizations',
      'users',
      'social_accounts',
      'posts',
      'analytics'
    ];

    for (const collectionName of collections) {
      const collectionRef = firestore.collection(collectionName);
      const snapshot = await collectionRef.limit(1).get();

      if (snapshot.empty) {
        // Create a placeholder document to establish the collection
        await collectionRef.doc('_placeholder').set({
          _placeholder: true,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Initialized collection: ${collectionName}`);
      }
    }

    console.log('✅ All collections initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize collections:', error);
    throw error;
  }
};

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const firestore = getFirestoreClient();
    await firestore.collection('_health_check').limit(1).get();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Helper function to generate Firestore document ID
export const generateId = (): string => {
  return getFirestoreClient().collection('_').doc().id;
};

// Helper function to get server timestamp
export const getServerTimestamp = () => {
  return admin.firestore.FieldValue.serverTimestamp();
};

// Helper function to convert Firestore timestamp to ISO string
export const timestampToISOString = (timestamp: any): string => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return new Date().toISOString();
};

export default {
  initializeDatabase,
  getFirestoreClient,
  getFirebaseAuth,
  initializeCollections,
  checkDatabaseHealth,
  generateId,
  getServerTimestamp,
  timestampToISOString
};
