import { config } from '../config/env.js';
import { retry } from '../utils/retry.js';
import { cacheGet, cacheSet, cacheKey } from '../utils/cache.js';
import { logger } from '../middleware/logger.js';

let accessToken = null;
let tokenExpiry = 0;

const MMI_BASE = 'https://atlas.mappls.com/api';

/**
 * Get OAuth2 token for MapMyIndia (Mappls) API.
 */
async function getToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiry) return accessToken;

  if (!config.geo.clientId) {
    throw Object.assign(new Error('MapMyIndia not configured'), { statusCode: 503 });
  }

  const res = await fetch('https://outpost.mappls.com/api/security/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.geo.clientId,
      client_secret: config.geo.clientSecret,
    }),
  });

  if (!res.ok) throw new Error(`MapMyIndia auth failed: ${res.status}`);
  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 60) * 1000; // refresh 60s early
  return accessToken;
}

/**
 * Authenticated fetch helper.
 */
async function mmiGet(path, params = {}) {
  const token = await getToken();
  const url = new URL(`${MMI_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(new Error(`MapMyIndia ${res.status}: ${text}`), { statusCode: res.status });
  }

  return res.json();
}

/**
 * Geocode an address to lat/lng.
 * Optimized for Indian addresses.
 */
export async function geocode(query) {
  const key = cacheKey('geo:geocode', { query });
  const cached = await cacheGet(key);
  if (cached) return { ...cached, cached: true };

  const data = await retry(
    () => mmiGet('/places/geocode', { address: query, region: 'IND' }),
    { retries: 2, label: 'geo:geocode' }
  );

  const results = (data.copResults || []).map((r) => ({
    formattedAddress: r.formattedAddress,
    latitude: r.latitude,
    longitude: r.longitude,
    type: r.type,
    placeId: r.eLoc,
    district: r.district,
    city: r.city,
    state: r.state,
    pincode: r.pincode,
  }));

  const result = { query, results, count: results.length };
  await cacheSet(key, result, config.geo.cacheTtl);
  return result;
}

/**
 * Reverse geocode lat/lng to address.
 */
export async function reverseGeocode(lat, lng) {
  const key = cacheKey('geo:reverse', { lat, lng });
  const cached = await cacheGet(key);
  if (cached) return { ...cached, cached: true };

  const data = await retry(
    () => mmiGet('/places/geocode', { lat, lng }),
    { retries: 2, label: 'geo:reverse' }
  );

  const result = {
    latitude: lat,
    longitude: lng,
    results: data.results || [],
  };

  await cacheSet(key, result, config.geo.cacheTtl);
  return result;
}

/**
 * Autocomplete / text search — great for search bars.
 */
export async function autosuggest(query, { location, zoom, pod } = {}) {
  const key = cacheKey('geo:suggest', { query, location, zoom });
  const cached = await cacheGet(key);
  if (cached) return { ...cached, cached: true };

  const data = await retry(
    () =>
      mmiGet('/places/search/json', {
        query,
        location,
        zoom,
        pod,
        region: 'IND',
      }),
    { retries: 2, label: 'geo:suggest' }
  );

  const results = (data.suggestedLocations || []).map((r) => ({
    placeName: r.placeName,
    placeAddress: r.placeAddress,
    latitude: r.latitude,
    longitude: r.longitude,
    type: r.type,
    placeId: r.eLoc,
    orderIndex: r.orderIndex,
  }));

  const result = { query, results, count: results.length };
  await cacheSet(key, result, config.geo.cacheTtl);
  return result;
}

/**
 * Distance matrix between origins and destinations.
 */
export async function distanceMatrix(origins, destinations, { profile = 'driving' } = {}) {
  // origins/destinations: arrays of {lat, lng}
  const srcStr = origins.map((o) => `${o.lng},${o.lat}`).join('|');
  const dstStr = destinations.map((d) => `${d.lng},${d.lat}`).join('|');

  const data = await retry(
    () =>
      mmiGet('/places/distance_matrix/json', {
        sources: srcStr,
        destinations: dstStr,
        profile,
        rtype: 1, // fastest route
      }),
    { retries: 2, label: 'geo:distance' }
  );

  return {
    origins,
    destinations,
    profile,
    rows: data.results?.distances || [],
    durations: data.results?.durations || [],
  };
}
