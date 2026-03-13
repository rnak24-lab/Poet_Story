import { useRef, useCallback, useEffect } from 'react';

/**
 * useDragScroll - 마우스 드래그로 가로 스크롤할 수 있게 해주는 훅
 * 터치 디바이스에서는 기본 스크롤이 작동하고,
 * 데스크탑에서는 마우스 클릭+드래그로 스크롤 가능
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasMoved = useRef(false);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeftStart.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const el = ref.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.2; // 드래그 속도 배율
    el.scrollLeft = scrollLeftStart.current - walk;

    // 5px 이상 움직이면 드래그로 판정 (클릭과 구분)
    if (Math.abs(walk) > 5) {
      hasMoved.current = true;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    isDragging.current = false;
    el.style.cursor = 'grab';
    el.style.userSelect = '';
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (isDragging.current) {
      isDragging.current = false;
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    }
  }, []);

  // 드래그 중 클릭(링크 이동) 방지
  const handleClick = useCallback((e: MouseEvent) => {
    if (hasMoved.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.cursor = 'grab';

    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('click', handleClick, true); // capture phase

    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('click', handleClick, true);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleClick]);

  return ref;
}
