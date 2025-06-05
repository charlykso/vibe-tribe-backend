import admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
declare let db: Firestore;
export declare const initializeDatabase: () => Promise<void>;
export declare const getFirestoreClient: () => Firestore;
export { db };
export declare const getFirebaseAuth: () => admin.auth.Auth;
export declare const initializeCollections: () => Promise<void>;
export declare const checkDatabaseHealth: () => Promise<boolean>;
export declare const generateId: () => string;
export declare const getServerTimestamp: () => admin.firestore.FieldValue;
export declare const timestampToISOString: (timestamp: any) => string;
declare const _default: {
    initializeDatabase: () => Promise<void>;
    getFirestoreClient: () => Firestore;
    getFirebaseAuth: () => admin.auth.Auth;
    initializeCollections: () => Promise<void>;
    checkDatabaseHealth: () => Promise<boolean>;
    generateId: () => string;
    getServerTimestamp: () => admin.firestore.FieldValue;
    timestampToISOString: (timestamp: any) => string;
};
export default _default;
//# sourceMappingURL=database.d.ts.map