"""Rate limiter — IP 기반. dev 는 in-memory, prod 는 Redis 권장 (storage_uri)."""
from slowapi import Limiter
from slowapi.util import get_remote_address

# 기본 키: 클라이언트 IP. 라우트별로 데코레이터로 한도 지정.
limiter = Limiter(key_func=get_remote_address)
