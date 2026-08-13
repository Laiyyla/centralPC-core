type LoginAttempt = {
  count: number;
  firstAttempt: number;
};

const attempts = new Map<string, LoginAttempt>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const attempt = attempts.get(identifier);

  if (!attempt) {
    attempts.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (now - attempt.firstAttempt > WINDOW_MS) {
    attempts.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  attempt.count++;

  if (attempt.count > MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - attempt.count };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of attempts.entries()) {
    if (now - value.firstAttempt > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}, WINDOW_MS);
