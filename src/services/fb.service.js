import admin from 'firebase-admin';
import { config } from '../config/env.js';
import { logger } from '../middleware/logger.js';

let app = null;
let auth = null;
let db = null;

function initFirebase() {
  if (!app && config.firebase.projectId) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
    });
    auth = admin.auth(app);
    db = admin.firestore(app);
    logger.info('✅ Firebase Admin initialized');
  }
}

function ensureInit() {
  initFirebase();
  if (!app) throw Object.assign(new Error('Firebase not configured'), { statusCode: 503 });
}

// ───────────── Auth ─────────────

/**
 * Verify a Firebase ID token.
 */
export async function verifyToken(idToken) {
  ensureInit();
  const decoded = await auth.verifyIdToken(idToken);
  return {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture,
    emailVerified: decoded.email_verified,
  };
}

/**
 * Create a new Firebase user.
 */
export async function createUser({ email, password, displayName }) {
  ensureInit();
  return auth.createUser({ email, password, displayName });
}

/**
 * Get user by UID.
 */
export async function getUser(uid) {
  ensureInit();
  return auth.getUser(uid);
}

/**
 * Set custom claims on a user (RBAC).
 */
export async function setClaims(uid, claims) {
  ensureInit();
  await auth.setCustomUserClaims(uid, claims);
  return { uid, claims };
}

// ───────────── Firestore ─────────────

/**
 * Read a document.
 */
export async function getDoc(collection, docId) {
  ensureInit();
  const snap = await db.collection(collection).doc(docId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Write/merge a document.
 */
export async function setDoc(collection, docId, data, merge = true) {
  ensureInit();
  await db.collection(collection).doc(docId).set(data, { merge });
  return { id: docId, ...data };
}

/**
 * Query a collection.
 */
export async function queryDocs(collection, { where = [], orderBy, limit = 50 } = {}) {
  ensureInit();
  let ref = db.collection(collection);

  for (const [field, op, value] of where) {
    ref = ref.where(field, op, value);
  }
  if (orderBy) ref = ref.orderBy(orderBy.field, orderBy.dir || 'asc');
  ref = ref.limit(limit);

  const snap = await ref.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Delete a document.
 */
export async function deleteDoc(collection, docId) {
  ensureInit();
  await db.collection(collection).doc(docId).delete();
  return { deleted: true, id: docId };
}

// ───────────── Memora Injection Hook ─────────────

/**
 * Read a Firestore doc and inject into Memora-compatible context.
 * This bridges Firebase data with API+ Memora agent memory.
 */
export async function readWithMemora(collection, docId) {
  const doc = await getDoc(collection, docId);
  if (!doc) return null;

  return {
    source: 'firebase',
    collection,
    docId,
    data: doc,
    memoraContext: {
      type: 'user_data',
      provider: 'fb.vidyacoddle.tech',
      payload: doc,
      retrievedAt: new Date().toISOString(),
    },
  };
}
