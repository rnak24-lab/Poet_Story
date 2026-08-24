'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdFitBanner } from './AdFitBanner';

export function Footer() {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      <footer className="bg-cream-50 border-t border-cream-200 px-6 py-8 pb-24 text-center">
        <div className="max-w-[430px] mx-auto space-y-4">
          {/* 카카오 애드핏 배너 */}
          <AdFitBanner />
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-xl">🌸</span>
            <span className="text-sm font-bold text-ink-500">시글담</span>
          </div>

          {/* Business Info */}
          <div className="text-[10px] text-ink-300 space-y-0.5 leading-relaxed">
            <p>상호명: 엔돌핀스튜디오 | 대표자명: 이유석</p>
            <p>사업자등록번호: 775-14-02749</p>
            <p>통신판매업 신고번호: 2026-서울강서-0927</p>
            <p>주소: 서울 강서구 까치산로 24길 9 - b02</p>
            <p>전화: 010-2565-6839 | 이메일: support@sigeuldam.kr</p>
          </div>

          {/* Links */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-ink-300">
            <Link href="/terms" className="hover:text-ink-500 underline">이용약관</Link>
            <span>|</span>
            <Link href="/terms#privacy" className="hover:text-ink-500 underline">개인정보처리방침</Link>
            <span>|</span>
            <Link href="/terms#guidelines" className="hover:text-ink-500 underline">커뮤니티 가이드라인</Link>
          </div>

          <p className="text-[9px] text-ink-200">&copy; 2026 시글담. All rights reserved.</p>
        </div>
      </footer>

      {/* Legacy modals kept for backward compatibility if opened programmatically */}
      {showTerms && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center" onClick={() => setShowTerms(false)}>
          <div className="bg-white rounded-2xl w-[90%] max-w-[400px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-cream-200 flex items-center justify-between">
              <h3 className="font-bold text-ink-700 text-lg">📋 이용약관</h3>
              <button onClick={() => setShowTerms(false)} className="text-ink-300 hover:text-ink-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="text-xs text-ink-500 whitespace-pre-wrap leading-relaxed font-sans">{TERMS_TEXT}</pre>
            </div>
            <div className="p-4 border-t border-cream-200">
              <button onClick={() => setShowTerms(false)} className="w-full py-3 rounded-xl bg-ink-700 text-white font-medium text-sm">닫기</button>
            </div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center" onClick={() => setShowPrivacy(false)}>
          <div className="bg-white rounded-2xl w-[90%] max-w-[400px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-cream-200 flex items-center justify-between">
              <h3 className="font-bold text-ink-700 text-lg">🔒 개인정보처리방침</h3>
              <button onClick={() => setShowPrivacy(false)} className="text-ink-300 hover:text-ink-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="text-xs text-ink-500 whitespace-pre-wrap leading-relaxed font-sans">{PRIVACY_TEXT}</pre>
            </div>
            <div className="p-4 border-t border-cream-200">
              <button onClick={() => setShowPrivacy(false)} className="w-full py-3 rounded-xl bg-ink-700 text-white font-medium text-sm">닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const TERMS_TEXT = `시글담 이용약관

제1조 (목적)
이 약관은 시글담(이하 "서비스")이 제공하는 시 창작 및 공유 서비스의 이용과 관련한 기본적인 사항을 정하는 데 목적이 있습니다.

제2조 (서비스의 내용)
① 서비스는 사용자에게 꽃말을 기반으로 한 시 창작 도구, 시 공유 및 커뮤니티 기능을 제공합니다.
② 연필(크레딧) 시스템을 통해 자동 완성 등 부가 기능을 이용할 수 있습니다.

제3조 (회원가입 및 탈퇴)
① 이용자는 이메일과 비밀번호로 회원가입할 수 있습니다.
② 회원은 언제든 서비스 탈퇴를 요청할 수 있습니다.

제4조 (연필 시스템)
① 연필은 자동 완성 기능 사용 시 1개가 소비됩니다.
② 연필은 추천인 코드 입력(서로 1개씩), 유료 구매 등으로 획득할 수 있습니다.
③ 유료 구매한 연필의 이용기간은 결제시점으로부터 1년입니다. 이용기간 경과 시 미사용 연필은 소멸됩니다.
④ 충전된 연필은 사용자 간 양도가 불가합니다.
⑤ 1회 최대 충전 금액은 10만원으로 제한됩니다.

제5조 (결제 및 환불)
① 연필은 서비스 내 결제 수단을 통해 유료로 구매할 수 있으며, 결제 완료 즉시 계정에 지급됩니다.
② 청약철회: 결제일로부터 7일 이내에 구매한 연필을 전혀 사용하지 않은 경우, 전액 환불(청약철회)을 요청할 수 있습니다. (전자상거래 등에서의 소비자보호에 관한 법률 제17조)
③ 부분 환불: 결제일로부터 7일 이내에 구매한 연필 중 일부를 사용한 경우, 미사용분에 한하여 환불이 가능합니다. 환불 금액은 (미사용 연필 수 / 구매 연필 수) × 결제 금액으로 산정합니다.
④ 환불 제한: 다음의 경우 환불이 제한됩니다.
  - 결제일로부터 7일이 경과한 경우 (미사용 여부와 관계없이)
  - 이벤트, 프로모션, 추천 코드 등으로 무상 지급된 연필
  - 부정한 방법으로 획득한 연필
⑤ 환불 방법: 환불은 원래 결제 수단으로 처리되며, 환불 승인 후 3~7영업일 이내에 완료됩니다. (카드사 사정에 따라 지연될 수 있습니다.)
⑥ 서비스 장애: 서비스 장애로 인해 연필이 정상 소비되지 않은 경우, 해당 연필을 복구하거나 환불합니다.
⑦ 환불 신청: 서비스 내 결제 내역 페이지에서 직접 요청하거나, support@sigeuldam.kr로 환불을 요청할 수 있습니다.

제6조 (콘텐츠의 권리)
① 사용자가 작성한 시의 저작권은 작성자에게 있습니다.
② 서비스는 시 공유 기능을 위해 작성된 콘텐츠를 플랫폼 내에서 표시할 수 있습니다.

제7조 (금지 행위 및 계정 차단)
아래에 해당하는 콘텐츠를 게시할 경우 경고 없이 계정이 영구 차단될 수 있습니다.

① 성적 콘텐츠: 음란물, 노골적 성적 묘사, 미성년자 관련 성적 표현
② 폭력/위협: 특정인 살해 협박, 자해·자살 조장, 테러 미화
③ 차별/혐오 표현: 인종·성별·종교·장애·성적지향 비하 및 혐오 선동
④ 불법 콘텐츠: 마약·도박 홍보, 사기·피싱 유도, 개인정보 유출
⑤ 저작권 침해: 타인의 시·가사를 무단 도용하여 자신의 작품으로 게시
⑥ 스팸/악용: 광고성 게시물, 도배, 추천 코드 악용(다중 계정 생성)

위반 시 조치:
- 경미한 위반: 1차 경고 → 2차 게시물 삭제 → 3차 영구 차단
- 심각한 위반(성범죄·테러 관련 등): 즉시 영구 차단 및 관련 기관 신고

제8조 (책임의 한계)
서비스는 AI 자동 완성 기능으로 생성된 콘텐츠에 대해 책임을 지지 않습니다.

부칙
이 약관은 2026년 3월 16일부터 적용됩니다.`;

const PRIVACY_TEXT = `시글담 개인정보처리방침

1. 수집하는 개인정보
① 필수 항목: 이메일 주소, 비밀번호(암호화 저장), 닉네임
② 선택 항목: 추천인 코드
③ 자동 수집 항목: 서비스 이용 기록, 접속 로그

2. 개인정보의 이용 목적
① 회원 관리: 회원 가입, 본인 확인, 서비스 이용
② 서비스 제공: 시 작성·저장·공유, 연필(크레딧) 관리
③ 서비스 개선: 이용 통계 분석, 기능 개선
④ 서비스 내부 관리: 부정 이용 방지, 관리자의 회원 정보 열람(이메일, 닉네임 등) 및 콘텐츠 관리

3. 개인정보의 보관 및 파기
① 회원 탈퇴 시 지체 없이 파기합니다.
② 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
  - 전자상거래 관련 기록: 5년
  - 접속 기록: 3개월

4. 개인정보의 제3자 제공
원칙적으로 개인정보를 제3자에게 제공하지 않습니다.
단, 법령에 의한 요청이 있는 경우 예외로 합니다.

5. 개인정보 보호 조치
① 비밀번호 암호화(bcrypt) 저장
② SSL/TLS 암호화 통신
③ 접근 권한 관리 및 제한

6. 개인정보의 국외 이전
서비스 제공을 위해 아래와 같이 개인정보 처리를 국외 업체에 위탁합니다.
- Supabase Inc. (미국) : 데이터베이스 호스팅
- Vercel Inc. (미국) : 웹 서비스 호스팅
- Google LLC (미국) : AI 자동 완성 기능

7. 이용자의 권리
① 개인정보 열람, 수정, 삭제를 요청할 수 있습니다.
② 개인정보 처리에 대한 동의를 철회할 수 있습니다.

8. 문의
개인정보 관련 문의: support@sigeuldam.kr
전화: 010-2565-6839

시행일: 2026년 3월 16일`;
