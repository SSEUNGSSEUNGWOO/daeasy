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

# 답장 주소(reply_to)는 두지 않는다 — 도메인이 다르면 네이버·다음이 "답장 주소가 다릅니다" 경고를 붙인다.
# 독자 답장은 newsletter@ → data-edu@kbrainc.com 포워딩으로 받는다 (도메인 메일 쪽 설정)
FROM_DEFAULT = "DAEASY(데이지) <newsletter@daeasy.co.kr>"
# ponytail: Resend 무료 구간 하루 100통. 구독자가 넘으면 요금제부터 올린다
BATCH = 100


def _headlines(body: str, limit: int = 5) -> list[str]:
    """Writer 본문의 항목 헤드라인 (`1. ### 제목` 또는 `### 제목`)."""
    found = re.findall(r"^\s*(?:\d+\.\s+)?###\s+(.+?)\s*$", body, re.M)
    return found[:limit]


def _unsub_url(site: str, email: str, secret: str) -> str:
    sig = hmac.new(secret.encode(), email.lower().encode(), hashlib.sha256).hexdigest()
    return f"{site}/api/newsletter/unsubscribe?e={quote(email)}&s={sig}"


def _date_ko(iso: str) -> str:
    y, m, d = iso[:10].split("-")
    return f"{y}년 {int(m)}월 {int(d)}일"


def _html(insight, site: str, unsub: str, prev: dict | None = None) -> str:
    """회색 바탕 위 흰 카드 640px — 메일은 화면을 다 못 채우니 여백을 배경으로 처리한다."""
    e = html.escape
    url = f"{site}/insights/{quote(insight.slug)}"
    cover = ""
    if insight.image_url:
        src = insight.image_url
        # Unsplash 는 URL 파라미터로 잘라준다 — 매일 같은 2:1 비율로 카드 상단에 꽉 차게
        if "images.unsplash.com" in src:
            src = f"{src.split('?')[0]}?w=1280&h=640&fit=crop&crop=entropy&q=80&fm=jpg"
        cover = (
            f'<a href="{url}"><img src="{e(src)}" alt="" width="640" '
            'style="display:block;width:100%;border-radius:14px 14px 0 0"></a>'
        )
    items = "".join(
        f'<li style="margin:0 0 10px">{e(h)}</li>' for h in _headlines(insight.body)
    )
    yesterday = (
        '<p style="font-size:13px;color:#71717a;margin:32px 0 0;border-top:1px solid #e4e4e7;padding-top:20px">'
        f'어제 놓치셨다면 → <a href="{site}/insights/{quote(prev["slug"])}" '
        f'style="color:#18181b;font-weight:700">{e(prev["title"])}</a></p>'
        if prev
        else ""
    )
    return (
        '<div style="background:#f4f4f5;padding:32px 12px;font-family:sans-serif">'
        '<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;'
        'font-size:15px;line-height:1.7;color:#18181b">'
        f"{cover}"
        '<div style="padding:28px 32px 32px">'
        '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;color:#71717a;margin:0 0 14px">'
        # 로고는 SVG 가 메일에서 안 먹혀 사이트의 PNG 심볼을 절대 URL 로 쓴다
        f'<tr><td style="font-weight:700;letter-spacing:.12em"><img src="{site}/logo/daeasy-symbol-mark.png" '
        'alt="DAEASY" width="22" height="22" style="vertical-align:middle;margin-right:8px">'
        '<span style="vertical-align:middle;color:#18181b">DAEASY</span>'
        '<span style="vertical-align:middle;margin-left:6px">뉴스레터</span></td>'
        f'<td align="right">{_date_ko(insight.published_at)}</td></tr></table>'
        f'<h1 style="font-size:24px;line-height:1.35;margin:0 0 6px"><a href="{url}" '
        f'style="color:#18181b;text-decoration:none">{e(insight.title)}</a></h1>'
        '<p style="font-weight:700;font-size:16px;margin:28px 0 10px">오늘 다룬 이야기</p>'
        f'<ol style="margin:0 0 28px;padding-left:22px">{items}</ol>'
        f'<a href="{url}" style="display:inline-block;background:#18181b;color:#fff;font-weight:700;'
        'padding:13px 24px;border-radius:8px;text-decoration:none">전문 읽기 →</a>'
        f"{yesterday}"
        "</div></div>"
        '<p style="max-width:640px;margin:20px auto 0;font-size:12px;color:#a1a1aa;text-align:center">'
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
        # "어제 놓치셨다면" — 직전 발행 글 1건 (없으면 그 줄이 빠진다)
        cur.execute(
            "SELECT slug, title FROM insights WHERE status = 'published' AND slug <> %s "
            "AND published_at <= %s ORDER BY published_at DESC LIMIT 1",
            (insight.slug, insight.published_at),
        )
        prev = cur.fetchone()
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
                    "subject": subject,
                    "html": _html(insight, site, unsub, prev),
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
                (subject, _html(insight, site, f"{site}/mypage", prev), insight.slug, sent),
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
