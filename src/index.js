import { LLMService } from './services/llm.service.js';
import { PayService } from './services/pay.service.js';
import { FbService } from './services/fb.service.js';
import { CdnService } from './services/cdn.service.js';
import { MailService } from './services/mail.service.js';
import { GeoService } from './services/geo.service.js';

export class VCT {
  /**
   * Initialize the VCT SDK with your vendor API keys.
   *
   * @param {Object} config
   * @param {Object} config.llm - { openaiKeys: [], geminiKeys: [], defaultProvider: 'openai' }
   * @param {Object} config.pay - { keyId: '', keySecret: '', webhookSecret: '' }
   * @param {Object} config.fb - { projectId: '', clientEmail: '', privateKey: '' }
   * @param {Object} config.cdn - { cloudName: '', apiKey: '', apiSecret: '' }
   * @param {Object} config.mail - { resendApiKey: '', fromEmail: '' }
   * @param {Object} config.geo - { clientId: '', clientSecret: '' }
   */
  constructor(config = {}) {
    this.llm = new LLMService(config.llm || {});
    this.pay = new PayService(config.pay || {});
    this.fb = new FbService(config.fb || {});
    this.cdn = new CdnService(config.cdn || {});
    this.mail = new MailService(config.mail || {});
    this.geo = new GeoService(config.geo || {});
  }
}
