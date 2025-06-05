import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
// Load environment variables from root .env
dotenv.config({ path: path.join(process.cwd(), '.env') });
let db;
// Mock Firestore for development
const createMockFirestore = () => {
    const collections = new Map();
    const mockQuery = async (collectionName, filters = []) => {
        const collection = collections.get(collectionName) || new Map();
        let results = Array.from(collection.values());
        // Apply basic filtering (simplified)
        filters.forEach(filter => {
            if (filter.operator === '==') {
                results = results.filter(doc => doc[filter.field] === filter.value);
            }
            else if (filter.operator === '>=') {
                results = results.filter(doc => doc[filter.field] >= filter.value);
            }
            else if (filter.operator === '<=') {
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
        collection: (name) => {
            if (!collections.has(name)) {
                collections.set(name, new Map());
            }
            return {
                add: async (data) => {
                    const id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const collection = collections.get(name);
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
                doc: (id) => ({
                    get: async () => {
                        const collection = collections.get(name);
                        const data = collection.get(id);
                        return {
                            id,
                            exists: !!data,
                            data: () => data || null
                        };
                    },
                    update: async (updates) => {
                        const collection = collections.get(name);
                        const existing = collection.get(id) || {};
                        collection.set(id, { ...existing, ...updates, id });
                        return { id };
                    },
                    set: async (data) => {
                        const collection = collections.get(name);
                        collection.set(id, { ...data, id });
                        return { id };
                    },
                    delete: async () => {
                        const collection = collections.get(name);
                        collection.delete(id);
                        return { id };
                    }
                }),
                where: (field, operator, value) => ({
                    where: (field2, operator2, value2) => ({
                        where: (field3, operator3, value3) => ({
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
export const initializeDatabase = async () => {
    try {
        // Check if Firebase Admin is already initialized
        if (admin.apps.length === 0) {
            // Initialize Firebase Admin with service account
            const serviceAccount = {
                type: "service_account",
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: process.env.FIREBASE_AUTH_URI,
                token_uri: process.env.FIREBASE_TOKEN_URI,
                auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
                client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
            };
            if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
                throw new Error('Missing Firebase configuration. Please check your environment variables.');
            }
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        }
        // Initialize Firestore
        db = getFirestore();
        // Test the connection by trying to read from a collection
        await db.collection('_health_check').limit(1).get();
        console.log('✅ Firebase Firestore connection established successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize Firebase database:', error);
        throw error;
    }
};
export const getFirestoreClient = () => {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
};
// Export db instance for direct access
export { db };
// Firebase Auth integration
export const getFirebaseAuth = () => {
    return admin.auth();
};
// Helper function to create collections with initial setup
export const initializeCollections = async () => {
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
    }
    catch (error) {
        console.error('❌ Failed to initialize collections:', error);
        throw error;
    }
};
// Database health check
export const checkDatabaseHealth = async () => {
    try {
        const firestore = getFirestoreClient();
        await firestore.collection('_health_check').limit(1).get();
        return true;
    }
    catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
};
// Helper function to generate Firestore document ID
export const generateId = () => {
    return getFirestoreClient().collection('_').doc().id;
};
// Helper function to get server timestamp
export const getServerTimestamp = () => {
    return admin.firestore.FieldValue.serverTimestamp();
};
// Helper function to convert Firestore timestamp to ISO string
export const timestampToISOString = (timestamp) => {
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
