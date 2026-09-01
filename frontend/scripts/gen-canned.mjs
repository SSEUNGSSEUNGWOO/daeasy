/**
 * AI 체험관 선택지(presets.ts)에 대한 모델 응답을 미리 생성해 public/experience/ 에 저장한다.
 * 방문자는 고정된 선택지에서 고르므로 매번 모델을 부를 이유가 없다 —
 * 저장된 원문을 클라이언트가 그대로 재생하므로 연출은 같고 API 비용은 0이다.
 *
 * **생성 결과는 손으로 다듬어도 된다.** 출력 JSON 은 그냥 데이터라, 어색한 문장이나
 * 밋밋한 HTML 을 직접 고쳐 완성도를 올리는 것이 정상 워크플로다.
 *
 * 사용법: dev 서버(npm run dev)를 띄운 상태에서 `node scripts/gen-canned.mjs`
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const PRESETS_FILE = "src/app/(site)/quiz/presets.ts";
const STATIONS = [
  { name: "report", constant: "REPORT_PRESETS" },
  { name: "vibe", constant: "VIBE_PRESETS" },
];

/** presets.ts 의 work 문자열을 그대로 읽는다 (선택지가 바뀌면 자동으로 따라간다). */
async function readPresets(constant) {
  const src = await fs.readFile(path.join(root, PRESETS_FILE), "utf8");
  const block = src.match(
    new RegExp(`export const ${constant}: Preset\\[\\] = \\[([\\s\\S]*?)\\n\\];`),
  );
  if (!block) throw new Error(`${constant} 를 찾지 못했습니다: ${PRESETS_FILE}`);
  return [...block[1].matchAll(/work:\s*"([^"]+)"/g)].map((m) => m[1]);
}

let seq = 0;
async function generate(station, work) {
  const res = await fetch(`${BASE}/api/experience/${station}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // 생성 도구는 IP당 시간당 5회 제한에 걸리면 안 된다. 호출마다 다른
      // x-forwarded-for 를 보내 버킷을 분리한다 (운영에선 Vercel 이 이 헤더를
      // 덮어쓰므로 방문자가 같은 방식으로 우회할 수는 없다).
      "x-forwarded-for": `10.0.0.${++seq}`,
    },
    body: JSON.stringify({ work }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${station} "${work}" 실패 (${res.status}): ${detail}`);
  }
  return res.text();
}

const outDir = path.join(root, "public", "experience");
await fs.mkdir(outDir, { recursive: true });

for (const station of STATIONS) {
  const works = await readPresets(station.constant);
  const out = {};
  for (const work of works) {
    process.stdout.write(`[${station.name}] ${work} ... `);
    out[work] = await generate(station.name, work);
    console.log(`${out[work].length} chars`);
  }
  const file = path.join(outDir, `${station.name}-canned.json`);
  await fs.writeFile(file, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`→ ${path.relative(root, file)}`);
}
