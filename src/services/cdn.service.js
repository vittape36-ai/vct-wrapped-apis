import { v2 as cloudinary } from 'cloudinary';

export class CdnService {
  constructor(config = {}) {
    this.config = config;
    this.configured = false;

    if (config.cloudName) {
      cloudinary.config({
        cloud_name: config.cloudName,
        api_key: config.apiKey,
        api_secret: config.apiSecret,
        secure: true,
      });
      this.configured = true;
    }
  }

  ensureConfig() {
    if (!this.configured) throw new Error('Cloudinary not configured');
  }

  getSignedUpload({ folder = 'vct', tags = [], maxBytes = 10_485_760 } = {}) {
    this.ensureConfig();

    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      timestamp,
      upload_preset: this.config.uploadPreset,
      folder,
      tags: tags.join(','),
      max_bytes: maxBytes,
    };

    const signature = cloudinary.utils.api_sign_request(params, this.config.apiSecret);

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.config.cloudName}/auto/upload`,
      params: { ...params, signature, api_key: this.config.apiKey },
    };
  }

  getSignedUrl(publicId, transforms = {}, ttlSeconds) {
    this.ensureConfig();
    const _ttl = ttlSeconds || this.config.signedUrlTtl;

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

  transform(publicId, transforms) {
    this.ensureConfig();

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
      url: `https://res.cloudinary.com/${this.config.cloudName}/image/upload/${transformStr}/${publicId}`,
      transform: transformStr,
      publicId,
    };
  }

  async deleteAsset(publicId) {
    this.ensureConfig();
    return cloudinary.uploader.destroy(publicId);
  }

  async getAsset(publicId) {
    this.ensureConfig();
    return cloudinary.api.resource(publicId);
  }
}
