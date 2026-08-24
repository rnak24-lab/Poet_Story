'use client';

import { useEffect, useRef } from 'react';

// 카카오 애드핏 배너 (adfit.kakao.com에서 발급한 DAN- 광고단위 ID, 비우면 미렌더링)
const ADFIT_UNIT = 'DAN-3LSudTB5NraONLRk';
const AD_WIDTH = 320;
const AD_HEIGHT = 100;

export function AdFitBanner() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!ADFIT_UNIT || loaded.current || !wrapRef.current) return;
    loaded.current = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://t1.daumcdn.net/kas/static/ba.min.js';
    wrapRef.current.appendChild(script);
    return () => {
      try {
        (window as unknown as { adfit?: { destroy?: (unit: string) => void } }).adfit?.destroy?.(ADFIT_UNIT);
      } catch {
        // noop
      }
    };
  }, []);

  if (!ADFIT_UNIT) return null;

  return (
    <div ref={wrapRef} className="flex justify-center py-3">
      <ins
        className="kakao_ad_area"
        style={{ display: 'none' }}
        data-ad-unit={ADFIT_UNIT}
        data-ad-width={AD_WIDTH}
        data-ad-height={AD_HEIGHT}
      />
    </div>
  );
}
