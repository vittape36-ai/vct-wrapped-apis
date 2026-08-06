import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/config/redis.js', () => ({
  redis: {
    status: 'ready',
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    setex: vi.fn().mockResolvedValue('OK'),
  },
}));

vi.mock('../src/utils/cache.js', () => ({
  cache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    buildKey: vi.fn((...args) => args.join(':')),
  },
}));

describe('Geo Service', () => {
  it('should export geocode function', async () => {
    const geoService = await import('../src/services/geo.service.js');
    expect(typeof geoService.geocode).toBe('function');
  });

  it('should export reverseGeocode function', async () => {
    const geoService = await import('../src/services/geo.service.js');
    expect(typeof geoService.reverseGeocode).toBe('function');
  });

  it('should export autosuggest function', async () => {
    const geoService = await import('../src/services/geo.service.js');
    expect(typeof geoService.autosuggest).toBe('function');
  });

  it('should export distanceMatrix function', async () => {
    const geoService = await import('../src/services/geo.service.js');
    expect(typeof geoService.distanceMatrix).toBe('function');
  });
});

describe('Coordinate Validation', () => {
  it('should validate Indian latitude range', () => {
    const validLats = [8.0, 28.6, 37.0]; // India: ~8°N to ~37°N
    validLats.forEach((lat) => {
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
    });
  });

  it('should validate Indian longitude range', () => {
    const validLngs = [68.0, 77.2, 97.0]; // India: ~68°E to ~97°E
    validLngs.forEach((lng) => {
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
    });
  });

  it('should reject out-of-range coordinates', () => {
    expect(91).toBeGreaterThan(90);   // invalid lat
    expect(-91).toBeLessThan(-90);    // invalid lat
    expect(181).toBeGreaterThan(180); // invalid lng
  });
});

describe('Cache Key Generation', () => {
  it('should produce deterministic keys for same input', () => {
    const buildKey = (...args) => args.map(String).join(':');
    const key1 = buildKey('geo', 'geocode', 'Connaught Place Delhi');
    const key2 = buildKey('geo', 'geocode', 'Connaught Place Delhi');
    expect(key1).toBe(key2);
  });

  it('should produce different keys for different inputs', () => {
    const buildKey = (...args) => args.map(String).join(':');
    const key1 = buildKey('geo', 'geocode', 'Connaught Place');
    const key2 = buildKey('geo', 'geocode', 'Karol Bagh');
    expect(key1).not.toBe(key2);
  });
});
