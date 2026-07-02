import { Router } from 'express';
import * as cdn from '../services/cdn.service.js';
import { ok, fail } from '../utils/response.js';

const router = Router();

/**
 * POST /cdn/v1/upload/sign
 * Body: { folder?, tags?, maxBytes? }
 * Returns signed upload params for client-side direct upload.
 */
router.post('/v1/upload/sign', async (req, res, next) => {
  try {
    const result = cdn.getSignedUpload(req.body);
    ok(res, result, { wrapper: 'cdn.vidyacoddle.tech' });
  } catch (err) {
    next(err);
    return;
  }
});

/**
 * POST /cdn/v1/url/sign
 * Body: { publicId, transforms?, ttlSeconds? }
 * Returns a signed delivery URL.
 */
router.post('/v1/url/sign', async (req, res, next) => {
  try {
    const { publicId, transforms, ttlSeconds } = req.body;
    if (!publicId) {
      fail(res, 400, 'publicId is required');
      return;
    }

    const url = cdn.getSignedUrl(publicId, transforms, ttlSeconds);
    ok(res, { url, publicId }, { wrapper: 'cdn.vidyacoddle.tech' });
  } catch (err) {
    next(err);
    return;
  }
});

/**
 * POST /cdn/v1/transform
 * Body: { publicId, transforms }
 * Returns an on-the-fly transformed URL.
 */
router.post('/v1/transform', async (req, res, next) => {
  try {
    const { publicId, transforms } = req.body;
    if (!publicId || !transforms) {
      fail(res, 400, 'publicId and transforms are required');
      return;
    }

    const result = cdn.transform(publicId, transforms);
    ok(res, result, { wrapper: 'cdn.vidyacoddle.tech' });
  } catch (err) {
    next(err);
    return;
  }
});

/**
 * DELETE /cdn/v1/asset/:publicId
 */
router.delete('/v1/asset/:publicId', async (req, res, next) => {
  try {
    const result = await cdn.deleteAsset(req.params.publicId);
    return ok(res, result, { wrapper: 'cdn.vidyacoddle.tech' });
  } catch (err) {
    next(err);
    return;
  }
});

/**
 * GET /cdn/v1/asset/:publicId
 */
router.get('/v1/asset/:publicId', async (req, res, next) => {
  try {
    const result = await cdn.getAsset(req.params.publicId);
    return ok(res, result, { wrapper: 'cdn.vidyacoddle.tech' });
  } catch (err) {
    next(err);
    return;
  }
});

export default router;
