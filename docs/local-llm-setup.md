# 사내 GPU PC 로 AI 체험관 추론 돌리기

`/quiz` 체험관(리포트·바이브 코딩)의 추론을 상시 켜두는 사내 PC 의 GPU 로 넘기는 절차.
성공하면 평시 API 비용이 0 이 되고, PC 가 죽어도 Gemini 로 자동 폴백해 체험관은 계속 돈다.

**전제:** RTX 5060 Ti 16GB 기준. 사내 PC 는 dataeasy 저장소를 클론할 필요가 없다 —
그냥 추론 엔드포인트일 뿐이라 코드와 무관하다.

---

## 동작 방식

```
방문자 → Vercel(/api/experience/*) → [사내 PC: Ollama] ← Cloudflare Tunnel
                                   └ 실패·20초 무응답 → Gemini 3.1 Flash-Lite
```

`LOCAL_LLM_URL` 환경변수가 **없으면 Gemini 만**, **있으면 로컬 우선**으로 자동 분기한다
(`frontend/src/lib/experience-llm.ts`). 코드 수정도 재배포도 필요 없다.

---

## 1. Ollama 설치 (사내 PC)

<https://ollama.com/download/windows> 에서 설치 후:

```powershell
ollama pull qwen3:14b
ollama run qwen3:14b "안녕하세요"   # 한국어 응답 확인
```

**모델 선택.** 16GB VRAM 이면 Q4 양자화 14B 급이 여유롭게 올라간다. `qwen3:14b` 를 기본으로
두되, 결과가 시원찮으면 `gemma3:12b` 도 받아 비교한다. 스테이션별 요구가 다르다 —
리포트는 짧은 한국어 구조화 텍스트라 쉽고, 바이브 코딩은 동작하는 HTML 생성이라 훨씬 어렵다.
**바이브 코딩은 로컬로 내리기 전에 반드시 눈으로 확인할 것.**

```powershell
# 서비스가 외부 요청을 받도록 (기본은 127.0.0.1 만 수신)
setx OLLAMA_HOST "0.0.0.0:11434"
# 모델을 메모리에 계속 올려둬 첫 응답 지연을 없앤다
setx OLLAMA_KEEP_ALIVE "-1"
```

설정 후 Ollama 를 재시작한다.

---

## 2. Cloudflare Tunnel 연결 (사내 PC)

사내 PC 는 NAT 뒤에 있어 Vercel 이 직접 못 부른다. 터널이 필요하다.
포트포워딩·고정 IP 불필요, 무료.

```powershell
winget install --id Cloudflare.cloudflared
cloudflared tunnel login
cloudflared tunnel create daeasy-llm
cloudflared tunnel route dns daeasy-llm llm.dataeasy.kr
```

`%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: daeasy-llm
credentials-file: C:\Users\<사용자>\.cloudflared\<터널ID>.json
ingress:
  - hostname: llm.dataeasy.kr
    service: http://localhost:11434
  - service: http_status:404
```

Windows 서비스로 등록해 재부팅 후에도 자동으로 뜨게 한다:

```powershell
cloudflared service install
```

---

## 3. 접근 잠그기 (중요)

터널만 열면 **누구나 우리 GPU 를 쓸 수 있다.** Cloudflare Access 로 잠근다:

Zero Trust 대시보드 → Access → Applications → Add an application → Self-hosted
- Application domain: `llm.dataeasy.kr`
- Policy: **Service Auth** → Service Token 발급

발급된 `Client ID` / `Client Secret` 을 Vercel 에 넣는다(4단계).
Cloudflare Access 를 쓰지 않는다면 최소한 `LOCAL_LLM_SECRET` 만이라도 반드시 설정하고,
Ollama 앞단에 헤더를 검사하는 리버스 프록시를 둔다.

> ⚠️ 아무 인증 없이 터널만 여는 구성은 하지 말 것. 공개된 추론 엔드포인트는 즉시 남용된다.

---

## 4. Vercel 환경변수 추가

Project Settings → Environment Variables:

| 키 | 값 |
|---|---|
| `LOCAL_LLM_URL` | `https://llm.dataeasy.kr` |
| `LOCAL_LLM_SECRET` | 3단계에서 만든 시크릿 (Sensitive 체크) |
| `LOCAL_LLM_MODEL` | `qwen3:14b` |

추가 후 재배포하면 그 시점부터 로컬 우선으로 돈다.
되돌리려면 `LOCAL_LLM_URL` 만 지우면 즉시 Gemini 로 복귀한다.

---

## 5. 확인

```powershell
# 로컬에서
curl http://localhost:11434/v1/chat/completions -H "Content-Type: application/json" `
  -d '{\"model\":\"qwen3:14b\",\"messages\":[{\"role\":\"user\",\"content\":\"안녕\"}]}'

# 터널 경유로
curl https://llm.dataeasy.kr/v1/models
```

배포 후 `/quiz/report` 에서 칩이 아닌 **직접 입력**으로 체험해본다
(칩은 미리 생성한 정적 응답이라 모델을 안 탄다 — `public/experience/*.json`).

Vercel 함수 로그에 `로컬 LLM 실패 — Gemini 로 폴백` 이 찍히면 터널이나 인증 문제다.

---

## 알아둘 제약

- **동시성 1.** GPU 1장이라 요청이 직렬로 처리된다. 바이브 코딩은 한 건에 30~60초가 걸릴 수
  있어, 동시 접속이 몰리면 뒷사람은 그만큼 기다린다. 바이브 라우트의 `maxDuration = 60`
  을 넘기면 함수가 끊긴다.
- **가용성.** PC 가 꺼지거나 Windows 업데이트로 재부팅되면 그동안 Gemini 로 넘어간다
  (체험관은 안 죽는다). 자동 로그인·절전 해제를 설정해두면 복귀가 빠르다.
- **전기료.** 100회/일 기준 월 6kWh 안팎으로 미미하다.
- **품질.** 14B 급은 Gemini 3.1 Flash-Lite 보다도 약할 수 있다. 로컬로 내린 뒤에는
  두 스테이션 모두 직접 입력으로 결과를 확인하고, 나쁘면 `LOCAL_LLM_URL` 을 지워 되돌린다.
