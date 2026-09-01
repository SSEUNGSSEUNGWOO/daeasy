import "server-only";

/**
 * AI 체험관(/quiz) 전용 텍스트 스트리밍 프로바이더.
 *
 * 우선순위: 로컬 GPU(Ollama) → Gemini.
 * - `LOCAL_LLM_URL` 이 없으면 곧장 Gemini 를 쓴다. 회사 PC 를 세팅하기 전/후에
 *   코드를 고치지 않고 환경변수만으로 전환하기 위함 (rate-limit 의 Upstash 패턴과 동일).
 * - 로컬이 첫 토큰까지 못 오면 Gemini 로 넘어간다. **첫 바이트를 흘린 뒤에는
 *   되돌릴 수 없으므로** 폴백 판정은 반드시 첫 토큰 이전에 끝낸다.
 *
 * 반환값은 순수 텍스트 스트림이다. 호출부(route)가 그대로 클라이언트로 흘린다.
 */

const GEMINI_MODEL = "gemini-3.1-flash-lite";
/** 로컬이 이 시간 안에 첫 토큰을 못 주면 죽은 것으로 보고 Gemini 로 넘긴다. */
const LOCAL_FIRST_TOKEN_TIMEOUT_MS = 20_000;

export type ExperiencePrompt = {
  system: string;
  user: string;
  maxTokens: number;
  /** 로그 식별용 (예: "experience/report") */
  label: string;
  signal: AbortSignal;
};

export class ExperienceUnavailableError extends Error {}

/**
 * SSE 응답에서 `data:` 페이로드만 뽑아낸다.
 * 네트워크 청크는 줄 중간에서 끊기므로 버퍼에 모아 줄 단위로 잘라야 한다
 * — 청크를 그대로 JSON.parse 하면 간헐적으로 깨진다.
 */
async function* sseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (line.startsWith("data:")) yield line.slice(5).trim();
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** 토큰 제너레이터를 클라이언트로 보낼 텍스트 스트림으로 감싼다. */
function toTextStream(
  tokens: AsyncGenerator<string>,
  label: string,
  signal: AbortSignal,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const text of tokens) {
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err) {
        if (!signal.aborted) console.error(`[${label}] 스트림 실패:`, err);
        try {
          controller.error(err);
        } catch {
          /* 이미 취소된 스트림 */
        }
      }
    },
    cancel() {
      void tokens.return(undefined);
    },
  });
}

// ── Gemini ──────────────────────────────────────────────────────────────────

async function* geminiTokens(p: ExperiencePrompt): AsyncGenerator<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new ExperienceUnavailableError("GEMINI_API_KEY 미설정");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: p.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: p.system }] },
        contents: [{ role: "user", parts: [{ text: p.user }] }],
        generationConfig: { maxOutputTokens: p.maxTokens },
      }),
    },
  );
  if (!res.ok || !res.body) {
    throw new Error(`Gemini ${res.status}: ${await res.text().catch(() => "")}`);
  }

  for await (const data of sseData(res.body)) {
    if (data === "[DONE]") break;
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      continue; // 하트비트 등 JSON 이 아닌 라인
    }
    const parts = (parsed as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
      .candidates?.[0]?.content?.parts;
    for (const part of parts ?? []) {
      if (part.text) yield part.text;
    }
  }
}

// ── 로컬 GPU (Ollama / OpenAI 호환) ──────────────────────────────────────────

async function* localTokens(
  p: ExperiencePrompt,
  baseUrl: string,
): AsyncGenerator<string> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.LOCAL_LLM_SECRET
        ? { Authorization: `Bearer ${process.env.LOCAL_LLM_SECRET}` }
        : {}),
    },
    signal: p.signal,
    body: JSON.stringify({
      model: process.env.LOCAL_LLM_MODEL ?? "qwen3:14b",
      stream: true,
      max_tokens: p.maxTokens,
      messages: [
        { role: "system", content: p.system },
        { role: "user", content: p.user },
      ],
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`로컬 LLM ${res.status}`);
  }

  for await (const data of sseData(res.body)) {
    if (data === "[DONE]") break;
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      continue;
    }
    const delta = (parsed as { choices?: { delta?: { content?: string } }[] })
      .choices?.[0]?.delta?.content;
    if (delta) yield delta;
  }
}

/**
 * 첫 토큰이 나올 때까지만 기다려보고, 살아있으면 나머지를 이어붙인 제너레이터를 준다.
 * 실패하면 null — 호출부가 조용히 Gemini 로 넘어간다.
 */
async function tryLocal(p: ExperiencePrompt): Promise<AsyncGenerator<string> | null> {
  const baseUrl = process.env.LOCAL_LLM_URL;
  if (!baseUrl) return null;

  const timer = new AbortController();
  const onAbort = () => timer.abort();
  p.signal.addEventListener("abort", onAbort, { once: true });
  const timeout = setTimeout(() => timer.abort(), LOCAL_FIRST_TOKEN_TIMEOUT_MS);

  const tokens = localTokens({ ...p, signal: timer.signal }, baseUrl);
  try {
    const first = await tokens.next();
    clearTimeout(timeout);
    p.signal.removeEventListener("abort", onAbort);
    if (first.done) return null; // 빈 응답 — 폴백
    return (async function* () {
      yield first.value;
      yield* tokens;
    })();
  } catch (err) {
    clearTimeout(timeout);
    p.signal.removeEventListener("abort", onAbort);
    if (p.signal.aborted) throw err; // 방문자가 떠난 것 — 폴백할 이유 없음
    console.error(`[${p.label}] 로컬 LLM 실패 — Gemini 로 폴백:`, err);
    return null;
  }
}

/**
 * 체험관 응답을 텍스트 스트림으로 반환한다.
 * 어떤 프로바이더도 못 쓰면 ExperienceUnavailableError 를 던진다 (호출부에서 503).
 */
export async function streamExperience(
  p: ExperiencePrompt,
): Promise<ReadableStream<Uint8Array>> {
  const local = await tryLocal(p);
  return toTextStream(local ?? geminiTokens(p), p.label, p.signal);
}

/** 사용 가능한 프로바이더가 하나라도 있는지 (라우트 진입 시 503 판정용). */
export function isExperienceConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.LOCAL_LLM_URL);
}
