import admin from 'firebase-admin';

export class FbService {
  constructor(config = {}) {
    this.app = null;
    this.auth = null;
    this.db = null;

    if (config.projectId) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.projectId,
          clientEmail: config.clientEmail,
          privateKey: config.privateKey,
        }),
      });
      this.auth = admin.auth(this.app);
      this.db = admin.firestore(this.app);
      console.log('✅ Firebase Admin initialized');
    }
  }

  ensureInit() {
    if (!this.app) throw new Error('Firebase not configured');
  }

  async verifyToken(idToken) {
    this.ensureInit();
    const decoded = await this.auth.verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      emailVerified: decoded.email_verified,
    };
  }

  async createUser({ email, password, displayName }) {
    this.ensureInit();
    return this.auth.createUser({ email, password, displayName });
  }

  async getUser(uid) {
    this.ensureInit();
    return this.auth.getUser(uid);
  }

  async setClaims(uid, claims) {
    this.ensureInit();
    await this.auth.setCustomUserClaims(uid, claims);
    return { uid, claims };
  }

  async getDoc(collection, docId) {
    this.ensureInit();
    const snap = await this.db.collection(collection).doc(docId).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  async setDoc(collection, docId, data, merge = true) {
    this.ensureInit();
    await this.db.collection(collection).doc(docId).set(data, { merge });
    return { id: docId, ...data };
  }

  async queryDocs(collection, { where = [], orderBy, limit = 50 } = {}) {
    this.ensureInit();
    let ref = this.db.collection(collection);

    for (const [field, op, value] of where) {
      ref = ref.where(field, op, value);
    }
    if (orderBy) ref = ref.orderBy(orderBy.field, orderBy.dir || 'asc');
    ref = ref.limit(limit);

    const snap = await ref.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async deleteDoc(collection, docId) {
    this.ensureInit();
    await this.db.collection(collection).doc(docId).delete();
    return { deleted: true, id: docId };
  }

  async readWithMemora(collection, docId) {
    const doc = await this.getDoc(collection, docId);
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
}
