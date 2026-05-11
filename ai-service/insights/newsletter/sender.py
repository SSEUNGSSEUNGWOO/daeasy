"""
뉴스레터 발송 모듈 (Resend 사용)
구독자 정보는 Supabase의 newsletter_subscribers 테이블을 단일 진실 소스로 사용.
"""
import os
import re
import urllib.parse
from datetime import date

import resend
import markdown as md_lib

from shared.db import get_conn


def load_subscribers() -> list[str]:
    """active 상태 구독자 이메일 목록을 DB에서 조회."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT email FROM newsletter_subscribers WHERE status = 'active' ORDER BY subscribed_at"
            )
            rows = cur.fetchall()
    return [row["email"] for row in rows]


def add_subscriber(email: str, source: str | None = None) -> bool:
    """이메일 추가. 이미 있으면 False, 새로 들어가면 True 반환."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO newsletter_subscribers (email, source)
                VALUES (%s, %s)
                ON CONFLICT (email) DO NOTHING
                RETURNING id
                """,
                (email, source),
            )
            inserted = cur.fetchone() is not None
        conn.commit()
    return inserted


def insight_to_html(title: str, body: str, slug: str, published_at: str, unsubscribe_url: str = "") -> str:
    site_url = os.getenv("SITE_URL", "https://dataeasy.kr")
    insight_url = f"{site_url}/insights/{slug}"

    # 전처리
    body = re.sub(r'^#[^\n]*\n+', '', body)  # H1 제거
    body = re.sub(r'^\*\*\d{4}-\d{2}-\d{2}\*\*\n*', '', body, flags=re.MULTILINE)
    body = re.sub(r'^\*\*리포트 날짜:[^\n]*\*\*\n*', '', body, flags=re.MULTILINE)
    body = re.sub(r'\n*---\n+\*?본 리포트는[^\n]*\*?\n*', '', body)
    # "N. ### 제목" → "### N. 제목" (번호 리셋 방지)
    body = re.sub(r'^(\d+)\.\s+###\s+(.+)$', r'### \1. \2', body, flags=re.MULTILINE)
    # --- 구분선 제거 (번호 리셋 원인)
    body = re.sub(r'\n---\n', '\n\n', body)

    # 마크다운 → HTML 변환
    body_html = md_lib.markdown(body, extensions=["tables", "fenced_code"])

    # H1 제거 (제목은 따로 표시)
    body_html = re.sub(r"<h1[^>]*>.*?</h1>", "", body_html, flags=re.DOTALL)
    # 이미지 제거
    body_html = re.sub(r"<img[^>]*>", "", body_html)

    today_str = date.fromisoformat(published_at).strftime("%Y년 %m월 %d일")

    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F0;font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">

    <!-- 헤더 -->
    <div style="margin-bottom:32px;">
      <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#888;margin-bottom:8px;">
        DATAEASY · {today_str}
      </div>
      <div style="font-size:11px;color:#888;">
        AI·데이터 인사이트 뉴스레터
      </div>
    </div>

    <!-- 제목 카드 -->
    <div style="background:#fff;border:1px solid #E5E5E0;border-radius:12px;padding:32px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#E94E1B;margin-bottom:12px;">
        DAILY INSIGHT
      </div>
      <h1 style="font-size:24px;font-weight:700;line-height:1.4;color:#17150F;margin:0 0 20px;">
        {title}
      </h1>
      <a href="{insight_url}" style="display:inline-block;background:#E94E1B;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">
        전체 리포트 보기 →
      </a>
    </div>

    <!-- 본문 -->
    <div style="background:#fff;border:1px solid #E5E5E0;border-radius:12px;padding:32px;margin-bottom:24px;
                font-size:15px;line-height:1.75;color:#3A362C;">
      <style>
        h2 {{ font-size:18px;font-weight:700;color:#17150F;margin:28px 0 12px; }}
        h3 {{ font-size:16px;font-weight:600;color:#17150F;margin:20px 0 8px; }}
        p {{ margin:0 0 16px; }}
        a {{ color:#E94E1B; }}
        ul, ol {{ padding-left:20px;margin:0 0 16px; }}
        li {{ margin-bottom:6px; }}
        blockquote {{ border-left:3px solid #E94E1B;margin:16px 0;padding:8px 16px;color:#74705F; }}
        img {{ max-width:100%;height:auto;border-radius:8px;margin:12px 0;display:block; }}
        code {{ background:#F5F5F0;padding:2px 6px;border-radius:4px;font-size:13px; }}
        table {{ border-collapse:collapse;width:100%;margin:16px 0; }}
        td, th {{ border:1px solid #E5E5E0;padding:8px 12px;font-size:14px; }}
        th {{ background:#F5F5F0;font-weight:600; }}
      </style>
      {body_html}
    </div>

    <!-- 푸터 -->
    <div style="text-align:center;font-size:12px;color:#999;line-height:1.8;">
      <p style="margin:0 0 8px;">
        <a href="{site_url}" style="color:#E94E1B;text-decoration:none;">dataeasy</a>
        &nbsp;·&nbsp; AI · 데이터 교육
      </p>
      <p style="margin:0 0 8px;">
        이 메일은 dataeasy 뉴스레터를 구독하신 분께 발송됩니다.
      </p>
      <p style="margin:0;">
        <a href="{unsubscribe_url}" style="color:#bbb;text-decoration:underline;">구독 취소</a>
      </p>
    </div>

  </div>
</body>
</html>"""


def send_newsletter(insight: dict) -> int:
    """
    insight: { title, body, slug, published_at, ... }
    반환값: 발송 성공 수
    """
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        print("[newsletter] RESEND_API_KEY 없음. 발송 생략.")
        return 0

    resend.api_key = api_key

    subscribers = load_subscribers()
    if not subscribers:
        print("[newsletter] 구독자 없음.")
        return 0

    title = insight["title"]
    sent = 0
    from_addr = os.getenv("NEWSLETTER_FROM", "dataeasy <newsletter@dataeasy.kr>")

    # Resend는 배치 발송 지원 (최대 100개)
    site_url = os.getenv("SITE_URL", "https://dataeasy.kr")

    batch = [
        {
            "from": from_addr,
            "to": [email],
            "subject": f"[dataeasy] {title}",
            "html": insight_to_html(
                title=title,
                body=insight["body"],
                slug=insight["slug"],
                published_at=insight["published_at"],
                unsubscribe_url=f"{site_url}/api/unsubscribe?email={urllib.parse.quote(email)}",
            ),
        }
        for email in subscribers
    ]

    try:
        # 100개씩 나눠서 발송
        for i in range(0, len(batch), 100):
            resend.Emails.send_batch(batch[i:i+100])
            sent += len(batch[i:i+100])
        print(f"[newsletter] 발송 완료: {sent}명")
    except Exception as e:
        print(f"[newsletter] 발송 오류: {e}")

    return sent
