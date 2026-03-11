'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppStore, type Notification } from '@/store/useAppStore';

const NOTIF_ICONS: Record<Notification['type'], string> = {
  like: '❤️',
  comment: '💬',
  view_milestone: '👀',
  achievement: '🏆',
};

export function BottomNav({ active }: { active: string }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [showNotifSheet, setShowNotifSheet] = useState(false);

  const navItems = [
    { id: 'home', label: '홈', icon: '🏠', href: '/' },
    { id: 'write', label: '글쓰기', icon: '✏️', href: '/write' },
    { id: 'feed', label: '피드', icon: '📖', href: '/feed' },
    { id: 'profile', label: '프로필', icon: '👤', href: '/profile' },
  ];

  const handleNotifClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowNotifSheet(!showNotifSheet);
  };

  const handleNotifItemClick = (notif: Notification) => {
    markNotificationRead(notif.id);
    setShowNotifSheet(false);
  };

  const recentNotifs = [...notifications].reverse().slice(0, 10);

  return (
    <>
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
              <button
                onClick={handleNotifClick}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </button>
            )}
          </Link>
        ))}
      </nav>

      {/* Notification Sheet */}
      {showNotifSheet && (
        <div className="fixed inset-0 z-[60]" onClick={() => setShowNotifSheet(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-[410px] mx-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col mx-2.5">
              <div className="px-5 pt-4 pb-3 border-b border-cream-200 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-ink-700">🔔 알림</h3>
                {unreadCount > 0 && (
                  <button onClick={() => markAllNotificationsRead()} className="text-xs text-ink-400 hover:text-ink-600">
                    모두 읽음
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {recentNotifs.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-3xl mb-2">🔔</p>
                    <p className="text-sm text-ink-300">아직 알림이 없어요</p>
                  </div>
                ) : (
                  <div className="divide-y divide-cream-100">
                    {recentNotifs.map(notif => (
                      <Link
                        key={notif.id}
                        href={notif.poemId ? `/poem/${notif.poemId}` : '/profile'}
                        onClick={() => handleNotifItemClick(notif)}
                        className={`block px-5 py-3.5 hover:bg-cream-50 transition-colors ${!notif.isRead ? 'bg-warm-50/50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg flex-shrink-0 mt-0.5">{NOTIF_ICONS[notif.type] || '🔔'}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${!notif.isRead ? 'text-ink-700 font-medium' : 'text-ink-500'}`}>
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-ink-300 mt-1">{timeAgo(notif.createdAt)}</p>
                          </div>
                          {!notif.isRead && <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 mt-2" />}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-cream-200 flex-shrink-0">
                <Link href="/profile" onClick={() => setShowNotifSheet(false)}
                  className="block text-center text-xs text-ink-400 hover:text-ink-600 py-1">
                  프로필에서 전체 보기 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}
