import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Upstash 기반 rate limiter.
 *
 * env (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) 가 없으면
 * 모든 호출을 통과시키는 no-op 으로 동작 — 로컬 개발에서 Upstash 가입 없이 작업 가능.
 *
 * Vercel 배포 시 위 두 env 추가하면 자동 활성화됩니다.
 *
 * **fail-open**: Redis 호출이 실패해도 요청을 통과시킨다. 문의 접수와 어드민
 * 로그인이 rate limiter 장애로 함께 죽는 것을 막기 위함이다.
 */

type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = REDIS_URL && REDIS_TOKEN
  ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
  : null;

const limiters = new Map<string, Ratelimit>();

function getLimiter(key: string, requests: number, window: `${number} ${"s" | "m" | "h"}`): Ratelimit | null {
  if (!redis) return null;
  const cacheKey = `${key}:${requests}:${window}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: false,
      prefix: `rl:${key}`,
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

/** request 의 client IP 를 추출 (Vercel/일반 환경 모두 대응). */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "anonymous";
}

/**
 * 호출자 식별자(보통 IP) 에 대해 sliding window rate limit.
 * 통과면 success: true. 막혔으면 success: false + reset(epoch ms).
 *
 * Upstash env 없으면 항상 success: true.
 */
export async function rateLimit(
  bucket: string,
  identifier: string,
  requests: number,
  window: `${number} ${"s" | "m" | "h"}`,
): Promise<RateLimitResult> {
  const limiter = getLimiter(bucket, requests, window);
  if (!limiter) {
    return { success: true, remaining: requests, reset: 0 };
  }
  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, reset };
  } catch (err) {
    // fail-open: Redis 장애 시 통과시킨다.
    // rate limit 은 부가 기능이고, 이것 때문에 문의 접수·어드민 로그인이
    // 통째로 멈추는 편이 더 큰 손해다. env 가 없을 때와 같은 동작.
    // 장애가 조용히 묻히지 않도록 함수 로그에는 남긴다.
    console.error(`[rate-limit] ${bucket} 버킷 조회 실패 — 통과 처리`, err);
    return { success: true, remaining: requests, reset: 0 };
  }
}
