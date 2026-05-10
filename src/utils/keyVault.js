/**
 * KeyVault — round-robin key rotation with automatic cooldown.
 *
 * Usage:
 *   const vault = new KeyVault(['key1', 'key2', 'key3']);
 *   const key = vault.next();       // round-robin
 *   vault.cooldown(key, 60_000);    // mark key as rate-limited for 60s
 */
export class KeyVault {
  #keys;
  #index;
  #cooldowns; // Map<key, resumeTimestamp>

  constructor(keys = []) {
    this.#keys = [...keys];
    this.#index = 0;
    this.#cooldowns = new Map();
  }

  get size() {
    return this.#keys.length;
  }

  /**
   * Get the next available key (round-robin, skipping cooled-down keys).
   * Throws if all keys are on cooldown.
   */
  next() {
    if (this.#keys.length === 0) {
      throw new Error('KeyVault is empty — no API keys configured');
    }

    const now = Date.now();
    const total = this.#keys.length;

    for (let i = 0; i < total; i++) {
      const idx = (this.#index + i) % total;
      const key = this.#keys[idx];
      const coolUntil = this.#cooldowns.get(key) || 0;

      if (now >= coolUntil) {
        this.#index = (idx + 1) % total;
        return key;
      }
    }

    throw new Error('All API keys are on cooldown. Try again later.');
  }

  /**
   * Put a key on cooldown for `durationMs` milliseconds.
   */
  cooldown(key, durationMs = 60_000) {
    this.#cooldowns.set(key, Date.now() + durationMs);
  }

  /**
   * Remove a key from cooldown.
   */
  resume(key) {
    this.#cooldowns.delete(key);
  }
}
