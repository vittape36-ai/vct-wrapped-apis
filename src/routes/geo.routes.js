import { Router } from 'express';
import { geocode, reverseGeocode, autosuggest, distanceMatrix } from '../services/geo.service.js';
import { ok, fail } from '../utils/response.js';

const router = Router();

/**
 * GET /geo/v1/geocode?q=address
 */
router.get('/v1/geocode', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return fail(res, 400, 'Query parameter "q" is required');

    const result = await geocode(q);
    return ok(res, result, { wrapper: 'geo.vidyacoddle.tech' });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /geo/v1/reverse?lat=...&lng=...
 */
router.get('/v1/reverse', async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return fail(res, 400, 'lat and lng query params are required');

    const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));
    return ok(res, result, { wrapper: 'geo.vidyacoddle.tech' });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /geo/v1/suggest?q=...&location=...&zoom=...
 */
router.get('/v1/suggest', async (req, res, next) => {
  try {
    const { q, location, zoom, pod } = req.query;
    if (!q) return fail(res, 400, 'Query parameter "q" is required');

    const result = await autosuggest(q, { location, zoom, pod });
    return ok(res, result, { wrapper: 'geo.vidyacoddle.tech' });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /geo/v1/distance
 * Body: { origins: [{lat,lng}], destinations: [{lat,lng}], profile? }
 */
router.post('/v1/distance', async (req, res, next) => {
  try {
    const { origins, destinations, profile } = req.body;
    if (!origins?.length || !destinations?.length) {
      return fail(res, 400, 'origins and destinations arrays are required');
    }

    const result = await distanceMatrix(origins, destinations, { profile });
    return ok(res, result, { wrapper: 'geo.vidyacoddle.tech' });
  } catch (err) {
    return next(err);
  }
});

export default router;
