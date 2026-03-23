'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function TermsContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle hash-based scrolling
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-warm-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-cream-200 px-6 pt-8 pb-5">
        <Link href="/" className="text-ink-300 text-sm">&larr; 홈으로</Link>
        <h1 className="text-2xl font-bold text-ink-700 mt-4">약관 및 정책</h1>
        <p className="text-sm text-ink-400 mt-1">시글담 서비스 이용 관련 약관과 정책을 확인하세요</p>
      </div>

      {/* Quick Nav */}
      <div className="px-6 py-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <a href="#terms" className="flex-shrink-0 px-4 py-2 rounded-full bg-ink-700 text-white text-xs font-medium">이용약관</a>
          <a href="#refund" className="flex-shrink-0 px-4 py-2 rounded-full bg-white text-ink-500 text-xs font-medium border border-cream-200">환불규정</a>
          <a href="#privacy" className="flex-shrink-0 px-4 py-2 rounded-full bg-white text-ink-500 text-xs font-medium border border-cream-200">개인정보처리방침</a>
          <a href="#guidelines" className="flex-shrink-0 px-4 py-2 rounded-full bg-white text-ink-500 text-xs font-medium border border-cream-200">커뮤니티 가이드라인</a>
        </div>
      </div>

      {/* Terms of Service */}
      <section id="terms" className="px-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink-700 mb-4 flex items-center gap-2">📋 이용약관</h2>
          <div className="text-sm text-ink-500 leading-relaxed space-y-4">
            <div>
              <h3 className="font-bold text-ink-600 mb-1">제1조 (목적)</h3>
              <p>이 약관은 시글담(이하 &quot;서비스&quot;)이 제공하는 시 창작 및 공유 서비스의 이용과 관련한 기본적인 사항을 정하는 데 목적이 있습니다.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink-600 mb-1">제2조 (서비스의 내용)</h3>
              <p>① 서비스는 사용자에게 꽃말을 기반으로 한 시 창작 도구, 시 공유 및 커뮤니티 기능을 제공합니다.</p>
              <p>② 연필(크레딧) 시스템을 통해 자동 완성 등 부가 기능을 이용할 수 있습니다.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink-600 mb-1">제3조 (회원가입 및 탈퇴)</h3>
              <p>① 이용자는 이메일과 비밀번호로 회원가입할 수 있습니다.</p>
              <p>② 회원은 언제든 서비스 탈퇴를 요청할 수 있습니다.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink-600 mb-1">제4조 (연필 시스템)</h3>
              <p>① 연필은 자동 완성 기능 사용 시 1개가 소비됩니다.</p>
              <p>② 연필은 추천인 코드 입력(서로 1개씩), 유료 구매 등으로 획득할 수 있습니다.</p>
              <p>③ 연필은 사용 기한이 없습니다.</p>
            </div>

            <div id="refund" className="scroll-mt-20">
              <h3 className="font-bold text-ink-600 mb-1">제5조 (결제 및 환불)</h3>
              <div className="bg-amber-50 rounded-xl p-4 my-2">
                <p className="text-xs font-medium text-amber-700 mb-2">환불 규정 요약</p>
                <div className="text-xs text-amber-600 space-y-1">
                  <p>• 결제 후 7일 이내 + 미사용 &rarr; <strong>전액 환불</strong></p>
                  <p>• 결제 후 7일 이내 + 일부 사용 &rarr; <strong>미사용분 부분 환불</strong></p>
                  <p>• 결제 후 7일 경과 &rarr; <strong>환불 불가</strong></p>
                  <p>• 무상 지급 연필(이벤트, 추천코드) &rarr; <strong>환불 불가</strong></p>
                </div>
              </div>
              <p>① 연필은 서비스 내 결제 수단을 통해 유료로 구매할 수 있으며, 결제 완료 즉시 계정에 지급됩니다.</p>
              <p>② 청약철회: 결제일로부터 7일 이내에 구매한 연필을 전혀 사용하지 않은 경우, 전액 환불(청약철회)을 요청할 수 있습니다. (전자상거래 등에서의 소비자보호에 관한 법률 제17조)</p>
              <p>③ 부분 환불: 결제일로부터 7일 이내에 구매한 연필 중 일부를 사용한 경우, 미사용분에 한하여 환불이 가능합니다. 환불 금액은 (미사용 연필 수 / 구매 연필 수) &times; 결제 금액으로 산정합니다.</p>
              <p>④ 환불 제한: 다음의 경우 환불이 제한됩니다.</p>
              <ul className="list-disc list-inside pl-2 text-ink-400">
                <li>결제일로부터 7일이 경과한 경우 (미사용 여부와 관계없이)</li>
                <li>이벤트, 프로모션, 추천 코드 등으로 무상 지급된 연필</li>
                <li>부정한 방법으로 획득한 연필</li>
              </ul>
              <p>⑤ 환불 방법: 환불은 원래 결제 수단으로 처리되며, 환불 승인 후 3~7영업일 이내에 완료됩니다. (카드사 사정에 따라 지연될 수 있습니다.)</p>
              <p>⑥ 서비스 장애: 서비스 장애로 인해 연필이 정상 소비되지 않은 경우, 해당 연필을 복구하거나 환불합니다.</p>
              <p>⑦ 환불 신청: 서비스 내 <Link href="/payment/history" className="text-ink-700 underline font-medium">결제 내역 페이지</Link>에서 직접 요청하거나, support@sigeuldam.kr로 환불을 요청할 수 있습니다.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink-600 mb-1">제6조 (콘텐츠의 권리)</h3>
              <p>① 사용자가 작성한 시의 저작권은 작성자에게 있습니다.</p>
              <p>② 서비스는 시 공유 기능을 위해 작성된 콘텐츠를 플랫폼 내에서 표시할 수 있습니다.</p>
            </div>

            <div>
              <h3 className="font-bold text-ink-600 mb-1">제7조 (금지 행위 및 계정 차단)</h3>
              <p className="mb-1">아래에 해당하는 콘텐츠를 게시할 경우 경고 없이 계정이 영구 차단될 수 있습니다.</p>
              <p>① 성적 콘텐츠: 음란물, 노골적 성적 묘사, 미성년자 관련 성적 표현</p>
              <p>② 폭력/위협: 특정인 살해 협박, 자해·자살 조장, 테러 미화</p>
              <p>③ 차별/혐오 표현: 인종·성별·종교·장애·성적지향 비하 및 혐오 선동</p>
              <p>④ 불법 콘텐츠: 마약·도박 홍보, 사기·피싱 유도, 개인정보 유출</p>
              <p>⑤ 저작권 침해: 타인의 시·가사를 무단 도용하여 자신의 작품으로 게시</p>
              <p>⑥ 스팸/악용: 광고성 게시물, 도배, 추천 코드 악용(다중 계정 생성)</p>
              <p className="mt-2">위반 시 조치:</p>
              <p>- 경미한 위반: 1차 경고 &rarr; 2차 게시물 삭제 &rarr; 3차 영구 차단</p>
              <p>- 심각한 위반(성범죄·테러 관련 등): 즉시 영구 차단 및 관련 기관 신고</p>
            </div>

            <div>
              <h3 className="font-bold text-ink-600 mb-1">제8조 (책임의 한계)</h3>
              <p>서비스는 AI 자동 완성 기능으로 생성된 콘텐츠에 대해 책임을 지지 않습니다.</p>
            </div>

            <div className="pt-2 border-t border-cream-200">
              <p className="text-xs text-ink-300">부칙: 이 약관은 2026년 3월 16일부터 적용됩니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Policy */}
      <section id="privacy" className="scroll-mt-20 px-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink-700 mb-4 flex items-center gap-2">🔒 개인정보처리방침</h2>
          <div className="text-sm text-ink-500 leading-relaxed space-y-4">
            <div>
              <h3 className="font-bold text-ink-600 mb-1">1. 수집하는 개인정보</h3>
              <p>① 필수 항목: 이메일 주소, 비밀번호(암호화 저장), 닉네임</p>
              <p>② 선택 항목: 추천인 코드</p>
              <p>③ 자동 수집 항목: 서비스 이용 기록, 접속 로그</p>
            </div>
            <div>
              <h3 className="font-bold text-ink-600 mb-1">2. 개인정보의 이용 목적</h3>
              <p>① 회원 관리: 회원 가입, 본인 확인, 서비스 이용</p>
              <p>② 서비스 제공: 시 작성·저장·공유, 연필(크레딧) 관리</p>
              <p>③ 서비스 개선: 이용 통계 분석, 기능 개선</p>
              <p>④ 서비스 내부 관리: 부정 이용 방지, 관리자의 회원 정보 열람 및 콘텐츠 관리</p>
            </div>
            <div>
              <h3 className="font-bold text-ink-600 mb-1">3. 개인정보의 보관 및 파기</h3>
              <p>① 회원 탈퇴 시 지체 없이 파기합니다.</p>
              <p>② 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
              <ul className="list-disc list-inside pl-2 text-ink-400">
                <li>전자상거래 관련 기록: 5년</li>
                <li>접속 기록: 3개월</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-ink-600 mb-1">4. 개인정보의 제3자 제공</h3>
              <p>원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의한 요청이 있는 경우 예외로 합니다.</p>
            </div>
            <div>
              <h3 className="font-bold text-ink-600 mb-1">5. 개인정보 보호 조치</h3>
              <p>① 비밀번호 암호화(bcrypt) 저장</p>
              <p>② SSL/TLS 암호화 통신</p>
              <p>③ 접근 권한 관리 및 제한</p>
            </div>
            <div>
              <h3 className="font-bold text-ink-600 mb-1">6. 개인정보의 국외 이전</h3>
              <p className="mb-1">서비스 제공을 위해 아래와 같이 개인정보 처리를 국외 업체에 위탁합니다.</p>
              <ul className="list-disc list-inside pl-2 text-ink-400">
                <li>Supabase Inc. (미국) : 데이터베이스 호스팅</li>
                <li>Vercel Inc. (미국) : 웹 서비스 호스팅</li>
                <li>Google LLC (미국) : AI 자동 완성 기능</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-ink-600 mb-1">7. 이용자의 권리</h3>
              <p>① 개인정보 열람, 수정, 삭제를 요청할 수 있습니다.</p>
              <p>② 개인정보 처리에 대한 동의를 철회할 수 있습니다.</p>
            </div>
            <div>
              <h3 className="font-bold text-ink-600 mb-1">8. 문의</h3>
              <p>개인정보 관련 문의: support@sigeuldam.kr</p>
              <p>전화: 010-2565-6839</p>
            </div>
            <div className="pt-2 border-t border-cream-200">
              <p className="text-xs text-ink-300">시행일: 2026년 3월 16일</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section id="guidelines" className="scroll-mt-20 px-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink-700 mb-4 flex items-center gap-2">🤝 커뮤니티 가이드라인</h2>
          <div className="text-sm text-ink-500 leading-relaxed space-y-3">
            <p className="text-red-500 font-medium">위반 시 경고 없이 계정이 영구 차단될 수 있습니다.</p>

            <div>
              <p className="font-bold text-ink-600 mb-1">금지 콘텐츠</p>
              <p>① 성적/선정적 콘텐츠</p>
              <p>② 폭력/혐오 표현</p>
              <p>③ 차별/비하 발언</p>
              <p>④ 불법 콘텐츠</p>
              <p>⑤ 저작권 침해</p>
              <p>⑥ 광고성 게시물, 도배, 스팸</p>
            </div>
          </div>
        </div>
      </section>

      {/* Business Info */}
      <section className="px-6 mb-6">
        <div className="bg-cream-100 rounded-2xl p-5">
          <p className="text-xs font-medium text-ink-500 mb-2">사업자 정보</p>
          <div className="text-[11px] text-ink-400 space-y-0.5">
            <p>상호명: 엔돌핀스튜디오 | 대표자명: 이유석</p>
            <p>사업자등록번호: 775-14-02749</p>
            <p>통신판매업 신고번호: 2026-서울강서-0927</p>
            <p>주소: 서울 강서구 까치산로 24길 9 - b02</p>
            <p>전화: 010-2565-6839 | 이메일: support@sigeuldam.kr</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl">📋</div></div>}>
      <TermsContent />
    </Suspense>
  );
}
