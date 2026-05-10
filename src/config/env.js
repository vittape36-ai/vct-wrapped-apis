import 'dotenv/config';
import Joi from 'joi';

const schema = Joi.object({
  PORT: Joi.number().default(4000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  REDIS_URL: Joi.string().uri().default('redis://localhost:6379'),
  VCT_MASTER_KEY: Joi.string().required(),

  // LLM
  OPENAI_API_KEYS: Joi.string().default(''),
  GEMINI_API_KEYS: Joi.string().default(''),
  LLM_DEFAULT_PROVIDER: Joi.string().valid('openai', 'gemini').default('openai'),
  LLM_FALLBACK_PROVIDER: Joi.string().valid('openai', 'gemini').default('gemini'),
  LLM_CACHE_TTL_SECONDS: Joi.number().default(3600),

  // Pay
  RAZORPAY_KEY_ID: Joi.string().default(''),
  RAZORPAY_KEY_SECRET: Joi.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().default(''),

  // Firebase
  FIREBASE_PROJECT_ID: Joi.string().default(''),
  FIREBASE_CLIENT_EMAIL: Joi.string().default(''),
  FIREBASE_PRIVATE_KEY: Joi.string().default(''),

  // CDN
  CLOUDINARY_CLOUD_NAME: Joi.string().default(''),
  CLOUDINARY_API_KEY: Joi.string().default(''),
  CLOUDINARY_API_SECRET: Joi.string().default(''),
  CDN_UPLOAD_PRESET: Joi.string().default('vct_uploads'),
  CDN_SIGNED_URL_TTL_SECONDS: Joi.number().default(3600),

  // Mail
  RESEND_API_KEY: Joi.string().default(''),
  MAIL_FROM_DEFAULT: Joi.string().default('noreply@vidya.tech'),
  MAIL_FROM_NAME: Joi.string().default('Vidya Coddle Tech'),

  // Geo
  MAPMYINDIA_CLIENT_ID: Joi.string().default(''),
  MAPMYINDIA_CLIENT_SECRET: Joi.string().default(''),
  GEO_CACHE_TTL_SECONDS: Joi.number().default(86400),
}).unknown(true);

const { error, value } = schema.validate(process.env);
if (error) {
  console.error('❌ Config validation error:', error.message);
  process.exit(1);
}

export const config = {
  port: value.PORT,
  env: value.NODE_ENV,
  isProduction: value.NODE_ENV === 'production',
  redis: { url: value.REDIS_URL },
  vctMasterKey: value.VCT_MASTER_KEY,

  llm: {
    openaiKeys: value.OPENAI_API_KEYS.split(',').filter(Boolean),
    geminiKeys: value.GEMINI_API_KEYS.split(',').filter(Boolean),
    defaultProvider: value.LLM_DEFAULT_PROVIDER,
    fallbackProvider: value.LLM_FALLBACK_PROVIDER,
    cacheTtl: value.LLM_CACHE_TTL_SECONDS,
  },

  pay: {
    keyId: value.RAZORPAY_KEY_ID,
    keySecret: value.RAZORPAY_KEY_SECRET,
    webhookSecret: value.RAZORPAY_WEBHOOK_SECRET,
  },

  firebase: {
    projectId: value.FIREBASE_PROJECT_ID,
    clientEmail: value.FIREBASE_CLIENT_EMAIL,
    privateKey: value.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },

  cdn: {
    cloudName: value.CLOUDINARY_CLOUD_NAME,
    apiKey: value.CLOUDINARY_API_KEY,
    apiSecret: value.CLOUDINARY_API_SECRET,
    uploadPreset: value.CDN_UPLOAD_PRESET,
    signedUrlTtl: value.CDN_SIGNED_URL_TTL_SECONDS,
  },

  mail: {
    resendKey: value.RESEND_API_KEY,
    fromDefault: value.MAIL_FROM_DEFAULT,
    fromName: value.MAIL_FROM_NAME,
  },

  geo: {
    clientId: value.MAPMYINDIA_CLIENT_ID,
    clientSecret: value.MAPMYINDIA_CLIENT_SECRET,
    cacheTtl: value.GEO_CACHE_TTL_SECONDS,
  },
};
