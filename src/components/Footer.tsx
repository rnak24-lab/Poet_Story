'use client';

import { useState } from 'react';

export function Footer() {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      <footer className="bg-cream-50 border-t border-cream-200 px-6 py-8 pb-24 text-center">
        <div className="max-w-[430px] mx-auto space-y-4">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-xl">🌸</span>
            <span className="text-sm font-bold text-ink-500">시글담</span>
          </div>

          {/* Business Info */}
          <div className="text-[10px] text-ink-300 space-y-0.5 leading-relaxed">
            <p>상호명: 시글담 | 대표: (대표자명)</p>
            <p>사업자등록번호: (000-00-00000)</p>
            {/* 통신판매업 신고 후 아래 주석 해제 */}
            {/* <p>통신판매업 신고번호: 제0000-서울OO-0000호</p> */}
            <p>주소: (사업장 주소)</p>
            <p>이메일: support@sigeuldam.kr</p>
          </div>

          {/* Links */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-ink-300">
            <button onClick={() => setShowTerms(true)} className="hover:text-ink-500 underline">이용약관</button>
            <span>|</span>
            <button onClick={() => setShowPrivacy(true)} className="hover:text-ink-500 underline">개인정보처리방침</button>
            <span>|</span>
            <button onClick={() => setShowTerms(true)} className="hover:text-ink-500 underline">커뮤니티 가이드라인</button>
          </div>

          <p className="text-[9px] text-ink-200">© 2026 시글담. All rights reserved.</p>
        </div>
      </footer>

      {/* Terms Modal */}
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

      {/* Privacy Modal */}
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
② 연필은 추천인 코드 입력(서로 1개씩), 유료 구매, 광고 시청 등으로 획득할 수 있습니다.
③ 구매한 연필은 환불이 불가능합니다.

제5조 (콘텐츠의 권리)
① 사용자가 작성한 시의 저작권은 작성자에게 있습니다.
② 서비스는 시 공유 기능을 위해 작성된 콘텐츠를 플랫폼 내에서 표시할 수 있습니다.

제6조 (금지 행위 및 계정 차단)
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

제7조 (책임의 한계)
서비스는 AI 자동 완성 기능으로 생성된 콘텐츠에 대해 책임을 지지 않습니다.

부칙
이 약관은 2026년 2월 22일부터 적용됩니다.`;

const PRIVACY_TEXT = `시글담 개인정보처리방침

1. 수집하는 개인정보
① 필수 항목: 이메일 주소, 비밀번호(암호화 저장), 닉네임
② 선택 항목: 추천인 코드
③ 자동 수집 항목: 서비스 이용 기록, 접속 로그

2. 개인정보의 이용 목적
① 회원 관리: 회원 가입, 본인 확인, 서비스 이용
② 서비스 제공: 시 작성·저장·공유, 연필(크레딧) 관리
③ 서비스 개선: 이용 통계 분석, 기능 개선

3. 개인정보의 보관 및 파기
① 회원 탈퇴 시 지체 없이 파기합니다.
② 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.

4. 개인정보의 제3자 제공
원칙적으로 개인정보를 제3자에게 제공하지 않습니다.
단, 법령에 의한 요청이 있는 경우 예외로 합니다.

5. 개인정보 보호 조치
① 비밀번호 암호화(bcrypt) 저장
② SSL/TLS 암호화 통신
③ 접근 권한 관리 및 제한

6. 이용자의 권리
① 개인정보 열람, 수정, 삭제를 요청할 수 있습니다.
② 개인정보 처리에 대한 동의를 철회할 수 있습니다.

7. 문의
개인정보 관련 문의: support@sigeuldam.kr

시행일: 2026년 2월 22일`;
