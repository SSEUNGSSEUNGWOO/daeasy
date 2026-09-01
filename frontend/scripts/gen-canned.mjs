/**
 * AI 체험관 선택지(presets.ts)에 대한 모델 응답을 미리 생성해 public/experience/ 에 저장한다.
 *
 * 방문자는 고정된 선택지에서 고르고 클라이언트가 저장된 원문을 재생하므로,
 * 운영 중에는 모델을 부르지 않는다 — 사이트에 LLM 런타임 경로가 없다.
 * 그래서 이 스크립트가 프롬프트를 들고 Gemini 를 직접 부른다 (dev 서버 불필요).
 *
 * **생성 결과는 손으로 다듬어도 된다.** 출력 JSON 은 그냥 데이터라, 어색한 문장이나
 * 밋밋한 HTML 을 직접 고쳐 완성도를 올리는 것이 정상 워크플로다.
 *
 * 사용법: frontend/ 에서 `node scripts/gen-canned.mjs`
 * 필요: .env.local 의 GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildReportPrompt, buildVibePrompt } from "./prompts.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MODEL = "gemini-3.1-flash-lite";
const MAX_TOKENS = { report: 1500, vibe: 3200 };

const PRESETS_FILE = "src/app/(site)/quiz/presets.ts";
const STATIONS = [
  { name: "report", constant: "REPORT_PRESETS", prompt: buildReportPrompt },
  { name: "vibe", constant: "VIBE_PRESETS", prompt: buildVibePrompt },
];

/** .env.local 에서 키를 읽는다 (Next.js 없이 도는 스크립트라 직접 파싱). */
async function env(name) {
  const text = await fs.readFile(path.join(root, ".env.local"), "utf8");
  const m = text.match(new RegExp(`^${name}=(.+)$`, "m"));
  if (!m) throw new Error(`.env.local 에 ${name} 이 없습니다`);
  return m[1].trim();
}

/** presets.ts 의 work 문자열을 그대로 읽는다 (선택지가 바뀌면 자동으로 따라간다). */
async function readPresets(constant) {
  const src = await fs.readFile(path.join(root, PRESETS_FILE), "utf8");
  const block = src.match(
    new RegExp(`export const ${constant}: Preset\\[\\] = \\[([\\s\\S]*?)\\n\\];`),
  );
  if (!block) throw new Error(`${constant} 를 찾지 못했습니다: ${PRESETS_FILE}`);
  return [...block[1].matchAll(/work:\s*"([^"]+)"/g)].map((m) => m[1]);
}

/**
 * 발행된 교육과정으로 카탈로그 줄을 만든다.
 * 요약 40자 절단은 라우트에 있던 규칙 그대로 — 과정 수만큼 곱해져 입력 토큰을 지배한다.
 */
async function buildCatalog() {
  const url = await env("NEXT_PUBLIC_SUPABASE_URL");
  const key = await env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const res = await fetch(
    `${url}/rest/v1/courses?select=slug,title,summary,level&order=sort_order.asc`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) throw new Error(`과정 조회 실패 ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  if (rows.length === 0) throw new Error("발행된 교육과정이 없습니다");
  console.log(`교육과정 ${rows.length}개 로드`);
  return rows
    .map((c) => `- ${c.slug} | ${c.title} (${c.level}) — ${(c.summary ?? "").slice(0, 40)}`)
    .join("\n");
}

async function generate(system, work, maxTokens, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: work }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const cand = data.candidates?.[0];
  if (cand?.finishReason && cand.finishReason !== "STOP") {
    // MAX_TOKENS 로 잘리면 추천 json 블록이 날아가 그 항목이 통째로 버려진다
    console.warn(`  ⚠ finishReason=${cand.finishReason}`);
  }
  const text = (cand?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  if (!text) throw new Error(`빈 응답: ${JSON.stringify(data).slice(0, 300)}`);
  return text;
}

const apiKey = await env("GEMINI_API_KEY");
const catalog = await buildCatalog();
const outDir = path.join(root, "public", "experience");
await fs.mkdir(outDir, { recursive: true });

for (const station of STATIONS) {
  const system = station.prompt(catalog);
  const works = await readPresets(station.constant);
  const out = {};
  for (const work of works) {
    process.stdout.write(`[${station.name}] ${work} ... `);
    out[work] = await generate(system, work, MAX_TOKENS[station.name], apiKey);
    console.log(`${out[work].length} chars`);
  }
  const file = path.join(outDir, `${station.name}-canned.json`);
  await fs.writeFile(file, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`→ ${path.relative(root, file)}`);
}
