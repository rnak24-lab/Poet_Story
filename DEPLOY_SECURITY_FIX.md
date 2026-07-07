# 배포 체크리스트 — 결제/연필 서버 인증 하드닝

브랜치: `fix/server-auth-pencils`

## ⚠️ 배포 순서 (반드시 이 순서로)

### 1. Supabase에 RPC 함수 먼저 배포
Supabase 대시보드 → SQL Editor → [`supabase/pencil_atomic_rpc.sql`](supabase/pencil_atomic_rpc.sql) 전체 붙여넣고 실행.
> 이걸 안 하면 결제 지급·연필 차감이 전부 실패한다. **앱 배포보다 먼저.**

### 2. 환경변수 추가 (Vercel 등)
```
USER_SESSION_SECRET=<길고 랜덤한 문자열 (openssl rand -base64 32)>
```
> 설정 안 하면 코드의 fallback 상수가 쓰여 세션 토큰이 위조 가능해진다. **프로덕션에서 반드시 설정.**

### 3. 빌드 + 로컬 검증 (node 있는 환경에서)
```
npm run build        # 타입/빌드 통과 확인
npm run start        # 또는 npm run dev
```

## 로컬 e2e 검증 (배포 전 필수)

| # | 시나리오 | 기대 결과 |
|---|---------|-----------|
| 1 | 이메일/카카오/네이버 로그인 | devtools → Application → Cookies 에 `sd_session` (httpOnly) 생성 |
| 2 | **취약점 재현**: 로그인 쿠키 없이 `POST /api/user/pencils {userId,action:'add',count:999}` | **404** (엔드포인트 삭제됨) |
| 3 | 연필 1개로 시 생성 성공 | 잔액 -1 (서버 차감), 응답 `pencils` 반영 |
| 4 | 시 생성 강제 실패(AI 오류) | 연필 자동 환불(잔액 그대로), 에러 모달 |
| 5 | 연필 0개로 생성 시도 | 402 → "연필 부족" 결제 유도 모달 |
| 6 | 토스 테스트 결제 → confirm | 연필 정확히 1회 지급, 새로고침 재요청 시 이중지급 없음 |
| 7 | 남의 orderId로 confirm | **403** (본인 주문만) |
| 8 | 7일 내 결제 환불 | 토스 취소 + 연필 원자적 차감. 남의 paymentId → 404 |
| 9 | 추천 코드 입력 | 양쪽 +1, 재사용/자기추천 거부 |
| 10 | 같은 업적 claim 2회 | 2번째는 `granted:0` (재지급 없음) |

## ⚠️ 알려진 마이그레이션 영향
배포 직후, **기존에 로그인돼 있던 사용자(localStorage에만 저장, 쿠키 없음)는 한 번 다시 로그인**해야 연필/결제/생성이 동작한다. 이는 의도된 보안 동작(서버 미검증 세션 무효화)이다. 트래픽 낮은 시간에 배포 권장.

## 변경 요약
- **신규** `src/lib/user-auth.ts` — HMAC 서명 세션 쿠키(`sd_session`). admin-auth.ts 패턴 미러.
- 로그인 확정 지점(login/verify/oauth-register/kakao·naver callback)에서 쿠키 발급.
- **삭제** `src/app/api/user/pencils/route.ts` — 무한 발급 벡터 제거.
- `generate-poem` 이 서버에서 연필 원자적 차감 + 실패 시 환불.
- **신규** `src/app/api/user/achievements/claim` — 서버 검증·멱등 업적 보상.
- referral·refund·payment·payment/confirm — 세션에서 userId 도출(body userId 무시) + 원자적 증감 + 소유권 검증.
- 업적 카탈로그 `src/data/achievements.ts` 로 추출(서버/클라 공유).

## 후속(이번 PR 제외)
- referral 다계정 파밍 rate-limit
- 업적 조건의 완전한 서버 재계산
