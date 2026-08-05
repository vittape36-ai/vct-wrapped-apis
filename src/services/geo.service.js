import { retry } from '../utils/retry.js';

const MMI_BASE = 'https://atlas.mappls.com/api';

export class GeoService {
  constructor(config = {}) {
    this.config = config;
    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  async getToken() {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiry) return this.accessToken;

    if (!this.config.clientId) {
      throw new Error('MapMyIndia not configured');
    }

    const res = await fetch('https://outpost.mappls.com/api/security/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!res.ok) throw new Error(`MapMyIndia auth failed: ${res.status}`);
    const data = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = now + (data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  async mmiGet(path, params = {}) {
    const token = await this.getToken();
    const url = new URL(`${MMI_BASE}${path}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MapMyIndia ${res.status}: ${text}`);
    }

    return res.json();
  }

  async geocode(query) {
    const data = await retry(
      () => this.mmiGet('/places/geocode', { address: query, region: 'IND' }),
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

    return { query, results, count: results.length };
  }

  async reverseGeocode(lat, lng) {
    const data = await retry(
      () => this.mmiGet('/places/geocode', { lat, lng }),
      { retries: 2, label: 'geo:reverse' }
    );

    return {
      latitude: lat,
      longitude: lng,
      results: data.results || [],
    };
  }

  async autosuggest(query, { location, zoom, pod } = {}) {
    const data = await retry(
      () =>
        this.mmiGet('/places/search/json', {
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

    return { query, results, count: results.length };
  }

  async distanceMatrix(origins, destinations, { profile = 'driving' } = {}) {
    const srcStr = origins.map((o) => `${o.lng},${o.lat}`).join('|');
    const dstStr = destinations.map((d) => `${d.lng},${d.lat}`).join('|');

    const data = await retry(
      () =>
        this.mmiGet('/places/distance_matrix/json', {
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
}
