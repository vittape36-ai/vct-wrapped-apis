import { Router } from 'express';
import * as fb from '../services/fb.service.js';
import { ok, fail } from '../utils/response.js';

const router = Router();

// ───── Auth ─────

/**
 * POST /fb/v1/auth/verify
 * Body: { idToken }
 */
router.post('/v1/auth/verify', async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return fail(res, 400, 'idToken is required');
    const user = await fb.verifyToken(idToken);
    return ok(res, user, { wrapper: 'fb.vidyacoddle.tech' });
  } catch (err) {
    next(err);
    return;
  }
});

/**
 * POST /fb/v1/auth/create
 * Body: { email, password, displayName }
 */
router.post('/v1/auth/create', async (req, res, next) => {
  try {
    const user = await fb.createUser(req.body);
    return ok(res, user, { wrapper: 'fb.vidyacoddle.tech' });
  } catch (err) {
    next(err);
    return;
  }
});

/**
 * GET /fb/v1/auth/user/:uid
 */
router.get('/v1/auth/user/:uid', async (req, res, next) => {
  try {
    const user = await fb.getUser(req.params.uid);
    return ok(res, user, { wrapper: 'fb.vidyacoddle.tech' });
  } catch (err) {
    next(err);
    return;
  }
});

/**
 * POST /fb/v1/auth/claims
 * Body: { uid, claims }
 */
router.post('/v1/auth/claims', async (req, res, next) => {
  try {
    const { uid, claims } = req.body;
    if (!uid) return fail(res, 400, 'uid is required');
    const result = await fb.setClaims(uid, claims);
    return ok(res, result, { wrapper: 'fb.vidyacoddle.tech' });
  } catch (err) {
    next(err);
    return;
  }
});

// ───── Firestore ─────

/**
 * GET /fb/v1/db/:collection/:docId
 */
router.get('/v1/db/:collection/:docId', async (req, res, next) => {
  try {
    const doc = await fb.getDoc(req.params.collection, req.params.docId);
    if (!doc) return fail(res, 404, 'Document not found');
    return ok(res, doc, { wrapper: 'fb.vidyacoddle.tech' });
  } catch (err) {
    next(err);
    return;
  }
});

/**
 * PUT /fb/v1/db/:collection/:docId
 * Body: { data, merge? }
 */
router.put('/v1/db/:collection/:docId', async (req, res, next) => {
  try {
    const { data, merge } = req.body;
    if (!data) return fail(res, 400, 'data object is required');
    const result = await fb.setDoc(req.params.collection, req.params.docId, data, merge);
    return ok(res, result, { wrapper: 'fb.vidyacoddle.tech' });
  } catch (err) {
    next(err);
    return;
  }
});

/**
 * POST /fb/v1/db/:collection/query
 * Body: { where?, orderBy?, limit? }
 */
router.post('/v1/db/:collection/query', async (req, res, next) => {
  try {
    const docs = await fb.queryDocs(req.params.collection, req.body);
    return ok(res, docs, { wrapper: 'fb.vidyacoddle.tech', count: docs.length });
  } catch (err) {
    next(err);
    return;
  }
});

/**
 * DELETE /fb/v1/db/:collection/:docId
 */
router.delete('/v1/db/:collection/:docId', async (req, res, next) => {
  try {
    const result = await fb.deleteDoc(req.params.collection, req.params.docId);
    return ok(res, result, { wrapper: 'fb.vidyacoddle.tech' });
  } catch (err) {
    next(err);
    return;
  }
});

// ───── Memora Bridge ─────

/**
 * GET /fb/v1/memora/:collection/:docId
 * Reads Firestore doc and wraps in Memora-compatible context.
 */
router.get('/v1/memora/:collection/:docId', async (req, res, next) => {
  try {
    const result = await fb.readWithMemora(req.params.collection, req.params.docId);
    if (!result) return fail(res, 404, 'Document not found');
    return ok(res, result, { wrapper: 'fb.vidyacoddle.tech', memora: true });
  } catch (err) {
    next(err);
    return;
  }
});

export default router;
