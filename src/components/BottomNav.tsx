'use client';

import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';

export function BottomNav({ active }: { active: string }) {
  const { notifications } = useAppStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { id: 'home', label: '홈', icon: '🏠', href: '/' },
    { id: 'write', label: '글쓰기', icon: '✏️', href: '/write' },
    { id: 'feed', label: '피드', icon: '📖', href: '/feed' },
    { id: 'profile', label: '프로필', icon: '👤', href: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-ink-50 px-6 py-3 flex justify-around z-50">
      {navItems.map(item => (
        <Link
          key={item.id}
          href={item.href}
          className={`flex flex-col items-center gap-1 relative ${active === item.id ? 'text-ink-700' : 'text-ink-300'}`}
        >
          <span className="text-xl">{item.icon}</span>
          <span className="text-xs">{item.label}</span>
          {item.id === 'profile' && unreadCount > 0 && (
            <span className="absolute -top-1 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
