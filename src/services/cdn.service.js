import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';

let configured = false;

function ensureConfig() {
  if (!configured && config.cdn.cloudName) {
    cloudinary.config({
      cloud_name: config.cdn.cloudName,
      api_key: config.cdn.apiKey,
      api_secret: config.cdn.apiSecret,
      secure: true,
    });
    configured = true;
  }
  if (!configured) throw Object.assign(new Error('Cloudinary not configured'), { statusCode: 503 });
}

/**
 * Generate a signed upload URL + params for client-side direct upload.
 */
export function getSignedUpload({ folder = 'vct', tags = [], maxBytes = 10_485_760 } = {}) {
  ensureConfig();

  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    upload_preset: config.cdn.uploadPreset,
    folder,
    tags: tags.join(','),
    max_bytes: maxBytes,
  };

  // Sign the params
  const signature = cloudinary.utils.api_sign_request(params, config.cdn.apiSecret);

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cdn.cloudName}/auto/upload`,
    params: { ...params, signature, api_key: config.cdn.apiKey },
  };
}

/**
 * Generate a signed delivery URL with transforms.
 *
 * @param {string} publicId
 * @param {Object} transforms - { width, height, crop, quality, format, ... }
 * @param {number} ttlSeconds - URL expiry (default from config)
 */
export function getSignedUrl(publicId, transforms = {}, ttlSeconds) {
  ensureConfig();
  const ttl = ttlSeconds || config.cdn.signedUrlTtl;

  const transformation = [];
  if (transforms.width) transformation.push({ width: transforms.width });
  if (transforms.height) transformation.push({ height: transforms.height });
  if (transforms.crop) transformation.push({ crop: transforms.crop });
  if (transforms.quality) transformation.push({ quality: transforms.quality });
  if (transforms.format) transformation.push({ fetch_format: transforms.format });

  return cloudinary.url(publicId, {
    sign_url: true,
    type: 'authenticated',
    transformation: transformation.length > 0 ? transformation : undefined,
    secure: true,
  });
}

/**
 * Transform an existing image on the fly.
 */
export function transform(publicId, transforms) {
  ensureConfig();

  const parts = [];
  if (transforms.width) parts.push(`w_${transforms.width}`);
  if (transforms.height) parts.push(`h_${transforms.height}`);
  if (transforms.crop) parts.push(`c_${transforms.crop}`);
  if (transforms.quality) parts.push(`q_${transforms.quality}`);
  if (transforms.format) parts.push(`f_${transforms.format}`);
  if (transforms.blur) parts.push(`e_blur:${transforms.blur}`);
  if (transforms.grayscale) parts.push('e_grayscale');

  const transformStr = parts.join(',');

  return {
    url: `https://res.cloudinary.com/${config.cdn.cloudName}/image/upload/${transformStr}/${publicId}`,
    transform: transformStr,
    publicId,
  };
}

/**
 * Delete an asset.
 */
export async function deleteAsset(publicId) {
  ensureConfig();
  return cloudinary.uploader.destroy(publicId);
}

/**
 * Get asset details.
 */
export async function getAsset(publicId) {
  ensureConfig();
  return cloudinary.api.resource(publicId);
}
