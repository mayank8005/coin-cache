interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

interface Options {
  key: string;
  capacity: number;
  refillPerSec: number;
}

export const takeToken = ({ key, capacity, refillPerSec }: Options): boolean => {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: capacity, lastRefill: now };
  const elapsed = (now - b.lastRefill) / 1000;
  b.tokens = Math.min(capacity, b.tokens + elapsed * refillPerSec);
  b.lastRefill = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
};

export const clientKey = (req: Request, prefix: string): string => {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() ?? "unknown";
  return `${prefix}:${ip}`;
};
