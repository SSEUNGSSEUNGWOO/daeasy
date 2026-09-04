"""발행 직후 구독자에게 인사이트 티저 메일 1통 (Resend).

본문은 넣지 않는다 — 제목·커버·항목 헤드라인만 보여 사이트로 오게 한다.
같은 slug 는 newsletter_issues 에 기록이 있으면 재발송하지 않는다 (재발행 안전).
NEWSLETTER_TEST_TO 가 있으면 그 주소로만 보내고 기록도 남기지 않는다 (미리보기용).
"""

import hashlib
import hmac
import html
import os
import re
from urllib.parse import quote

import requests

from shared.db import get_conn

FROM_DEFAULT = "DAEASY(데이지) <newsletter@daeasy.co.kr>"
# 답장은 문의 메일함으로 — no-reply 로 두면 독자 답장(리드)이 반송된다
REPLY_TO = "data-edu@kbrainc.com"
# ponytail: Resend 무료 구간 하루 100통. 구독자가 넘으면 요금제부터 올린다
BATCH = 100


def _headlines(body: str, limit: int = 5) -> list[str]:
    """Writer 본문의 항목 헤드라인 (`1. ### 제목` 또는 `### 제목`)."""
    found = re.findall(r"^\s*(?:\d+\.\s+)?###\s+(.+?)\s*$", body, re.M)
    return found[:limit]


def _unsub_url(site: str, email: str, secret: str) -> str:
    sig = hmac.new(secret.encode(), email.lower().encode(), hashlib.sha256).hexdigest()
    return f"{site}/api/newsletter/unsubscribe?e={quote(email)}&s={sig}"


def _html(insight, site: str, unsub: str) -> str:
    e = html.escape
    url = f"{site}/insights/{quote(insight.slug)}"
    cover = (
        f'<a href="{url}"><img src="{e(insight.image_url)}" alt="" width="560" '
        'style="display:block;width:100%;max-width:560px;border-radius:12px"></a>'
        if insight.image_url
        else ""
    )
    items = "".join(
        f'<li style="margin:0 0 8px">{e(h)}</li>' for h in _headlines(insight.body)
    )
    return (
        '<div style="font-family:sans-serif;font-size:15px;line-height:1.7;color:#18181b;'
        'max-width:560px;margin:0 auto;padding:24px 16px">'
        '<p style="font-size:12px;font-weight:700;letter-spacing:.12em;color:#71717a;margin:0 0 12px">'
        "DAEASY 뉴스레터</p>"
        f'<h1 style="font-size:22px;line-height:1.35;margin:0 0 16px"><a href="{url}" '
        f'style="color:#18181b;text-decoration:none">{e(insight.title)}</a></h1>'
        f"{cover}"
        '<p style="font-weight:700;margin:24px 0 8px">오늘 다룬 이야기</p>'
        f'<ol style="margin:0 0 24px;padding-left:20px">{items}</ol>'
        f'<a href="{url}" style="display:inline-block;background:#18181b;color:#fff;font-weight:700;'
        'padding:12px 22px;border-radius:8px;text-decoration:none">전문 읽기 →</a>'
        '<p style="font-size:12px;color:#a1a1aa;margin:40px 0 0;border-top:1px solid #e4e4e7;padding-top:16px">'
        "케이브레인컴퍼니 · DAEASY(데이지) · 매일 AI·데이터 인사이트<br>"
        f'<a href="{unsub}" style="color:#a1a1aa">수신 거부</a></p>'
        "</div>"
    )


def send(insight) -> None:
    api_key = os.environ.get("RESEND_API_KEY")
    secret = os.environ.get("NEWSLETTER_UNSUB_SECRET")
    site = os.environ.get("NEXT_PUBLIC_SITE_URL")
    if not (api_key and secret and site):
        print("[newsletter] RESEND_API_KEY / NEWSLETTER_UNSUB_SECRET / NEXT_PUBLIC_SITE_URL 미설정 — 발송 생략")
        return
    sender = os.environ.get("NEWSLETTER_FROM") or FROM_DEFAULT
    test_to = os.environ.get("NEWSLETTER_TEST_TO")

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT 1 FROM newsletter_issues WHERE insight_slug = %s", (insight.slug,))
        if cur.fetchone() and not test_to:
            print(f"[newsletter] 이미 발송된 인사이트 — 생략: {insight.slug}")
            return
        if test_to:
            emails = [test_to]
        else:
            cur.execute("SELECT email FROM newsletter_subscribers WHERE status = 'active'")
            emails = [r["email"] for r in cur.fetchall()]
    if not emails:
        print("[newsletter] 활성 구독자 없음 — 발송 생략")
        return

    subject = f"[DAEASY 뉴스레터] {insight.title}"
    sent = 0
    for i in range(0, len(emails), BATCH):
        batch = []
        for email in emails[i : i + BATCH]:
            unsub = _unsub_url(site, email, secret)
            batch.append(
                {
                    "from": sender,
                    "to": [email],
                    "reply_to": REPLY_TO,
                    "subject": subject,
                    "html": _html(insight, site, unsub),
                    "headers": {
                        "List-Unsubscribe": f"<{unsub}>",
                        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                    },
                }
            )
        headers = {"Authorization": f"Bearer {api_key}"}
        if not test_to:
            # 타임아웃 뒤 재실행해도 Resend 가 같은 요청으로 보고 중복 발송하지 않는다 (24h 유지).
            # 테스트는 매번 다시 받아봐야 하므로 키를 붙이지 않는다
            digest = hashlib.sha256(insight.slug.encode()).hexdigest()[:32]
            headers["Idempotency-Key"] = f"newsletter/{digest}/{i // BATCH}"
        res = requests.post(
            "https://api.resend.com/emails/batch",
            headers=headers,
            json=batch,
            timeout=30,
        )
        if res.ok:
            sent += len(batch)
        else:
            # ponytail: 일부 배치만 실패해도 이력은 sent 로 남는다 — 실패 배치 수신자는 여기 출력으로만
            # 남으니 손으로 처리. 구독자가 100명을 넘어 배치가 여럿이 되면 배치별 이력으로 바꾼다
            print(f"[newsletter] 발송 실패 ({res.status_code}): {res.text[:300]}")
            print(f"[newsletter] 실패 수신자: {', '.join(emails[i : i + BATCH])}")

    print(f"[newsletter] {sent}/{len(emails)}명 발송{' (테스트)' if test_to else ''}")
    if sent and not test_to:
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO newsletter_issues (subject, content, insight_slug, status, sent_at, recipient_count)
                VALUES (%s, %s, %s, 'sent', now(), %s)
                """,
                (subject, _html(insight, site, f"{site}/mypage"), insight.slug, sent),
            )
            conn.commit()


if __name__ == "__main__":
    # 헤드라인 추출 자체 점검
    sample = "## 핵심\n\n1. ### 첫 번째\n\n   본문\n\n2. ### 두 번째  \n### 세 번째\n#### 넷"
    assert _headlines(sample) == ["첫 번째", "두 번째", "세 번째"], _headlines(sample)
    # 서명은 대소문자 무관 (unsubscribe 핸들러도 lower() 후 검증)
    a, b = _unsub_url("https://x", "A@b.c", "k"), _unsub_url("https://x", "a@B.C", "k")
    assert a.split("&s=")[1] == b.split("&s=")[1]
    print("ok")
