# dataeasy backend

FastAPI 백엔드. uv 가상환경.

## 셋업

```bash
uv sync
cp .env.example .env  # 값 채우기
```

## 실행

```bash
uv run uvicorn app.main:app --reload
```

API 문서: http://localhost:8000/docs

## 테스트 / 린트

```bash
uv run pytest
uv run ruff check .
uv run ruff format .
```
