import { logStep, logError } from './logging.ts';

// Custom signature verification to avoid SubtleCryptoProvider issues
export const verifyStripeSignature = async (body: string, signature: string, secret: string): Promise<boolean> => {
  try {
    logStep("Starting signature verification", { signatureLength: signature.length, bodyLength: body.length });
    
    const elements = signature.split(',');
    let timestamp: string | null = null;
    let v1: string | null = null;

    for (const element of elements) {
      const [key, value] = element.split('=');
      if (key === 't') {
        timestamp = value;
      } else if (key === 'v1') {
        v1 = value;
      }
    }

    if (!timestamp || !v1) {
      logError("Invalid signature format", { timestamp: !!timestamp, v1: !!v1 });
      return false;
    }

    // Check timestamp (not older than 5 minutes)
    const timestampMs = parseInt(timestamp) * 1000;
    const now = Date.now();
    if (now - timestampMs > 300000) { // 5 minutes
      logError("Timestamp too old", { timestampMs, now, diff: now - timestampMs });
      return false;
    }

    // Create expected signature using Web Crypto API properly
    const encoder = new TextEncoder();
    const data = encoder.encode(timestamp + '.' + body);
    const keyData = encoder.encode(secret);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature_bytes = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const expectedSignature = Array.from(new Uint8Array(signature_bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = expectedSignature === v1;
    logStep("Signature verification result", { isValid, expectedLength: expectedSignature.length, receivedLength: v1.length });
    
    return isValid;
  } catch (error) {
    logError("Signature verification failed", { error: error.message, stack: error.stack?.substring(0, 200) });
    return false;
  }
};