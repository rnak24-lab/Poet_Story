-- ============================================================
-- 연필(pencils) 원자적 증감 RPC
-- ============================================================
-- 배포 방법: Supabase 대시보드 → SQL Editor 에 아래 전체를 붙여넣고 실행.
-- (앱 배포 전에 먼저 실행해야 합니다. 없으면 결제 지급/생성 차감이 실패합니다.)
--
-- 왜 필요한가: 기존 코드는 (현재값 읽기 → +N 쓰기) 패턴이라 동시 요청 시
-- 갱신이 유실될 수 있었다. 아래 함수는 단일 UPDATE로 원자적으로 증감한다.
-- ============================================================

-- 증가/환불용: delta 만큼 증감하고 최종 잔액을 반환 (0 미만은 0으로 클램프)
create or replace function increment_pencils(p_user_id uuid, p_delta int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_val int;
begin
  update users
    set pencils = greatest(0, coalesce(pencils, 0) + p_delta)
    where id = p_user_id
    returning pencils into new_val;
  return new_val; -- 해당 유저가 없으면 null
end;
$$;

-- 차감용: pencils > 0 일 때만 1자루 차감하고 최종 잔액 반환.
-- 잔액이 부족하면(또는 유저 없음) 업데이트된 행이 없어 null 을 반환한다 → 호출측에서 402 처리.
create or replace function spend_pencil(p_user_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_val int;
begin
  update users
    set pencils = pencils - 1
    where id = p_user_id and pencils > 0
    returning pencils into new_val;
  return new_val;
end;
$$;
