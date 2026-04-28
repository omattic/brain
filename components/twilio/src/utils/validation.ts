function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function toBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

function getTwilioAuthToken() {
  return process.env.TWILIO_AUTH_TOKEN || process.env.TWILLIO_AUTH_TOKEN || "";
}

export function getTwilioConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID || process.env.TWILLIO_ACCOUNT_SID || "",
    authToken: getTwilioAuthToken(),
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || process.env.TWILLIO_PHONE_NUMBER || "",
  };
}

export async function createTwilioSignature(url: string, params: URLSearchParams, authToken: string) {
  const entries = Array.from(params.entries()).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
  const payload = entries.reduce((accumulator, [key, value]) => `${accumulator}${key}${value}`, url);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64(digest);
}

export async function isValidTwilioSignature(
  requestUrl: string,
  signature: string | null,
  params: URLSearchParams,
  authToken: string = getTwilioAuthToken(),
) {
  if (!authToken) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expectedSignature = await createTwilioSignature(requestUrl, params, authToken);
  return timingSafeEqual(signature, expectedSignature);
}
