import crypto from "crypto";

const ALGORITHM = "sha1";
const DIGITS = 6;
const STEP = 30;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const base32Encode = (buf: Buffer): string => {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
};

const base32Decode = (input: string): Buffer => {
  const clean = input.toUpperCase().replace(/=+$/, "");
  const lookup: Record<string, number> = Object.fromEntries(ALPHABET.split("").map((c, i) => [c, i]));
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    if (!(char in lookup)) throw new Error("Invalid base32 character");
    value = (value << 5) | lookup[char];
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
};

const counter = (time: number) => Math.floor(Math.floor(time / 1000) / STEP);

const hotp = (key: Buffer, count: number): string => {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(count));
  const hmac = crypto.createHmac(ALGORITHM, key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 10 ** DIGITS).padStart(DIGITS, "0");
};

export const generateSecret = (): string => base32Encode(crypto.randomBytes(20));

export const keyuri = (label: string, issuer: string, secret: string): string => {
  const params = new URLSearchParams({ secret, issuer, algorithm: "SHA1", digits: String(DIGITS), period: String(STEP) });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?${params}`;
};

export const generate = (secret: string, time = Date.now()): string =>
  hotp(base32Decode(secret), counter(time));

export const verify = (token: string, secret: string): boolean => {
  const key = base32Decode(secret);
  const now = counter(Date.now());
  return [-1, 0, 1].some((drift) => {
    const expected = hotp(key, now + drift);
    return token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  });
};
