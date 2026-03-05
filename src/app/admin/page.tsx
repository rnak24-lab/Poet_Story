'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'poems' | 'users'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [poems, setPoems] = useState<any[]>([]);
  const [poemTotal, setPoemTotal] = useState(0);
  const [poemSearch, setPoemSearch] = useState('');
  const [poemFilter, setPoemFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Pencil edit modal
  const [editPencilUser, setEditPencilUser] = useState<any>(null);
  const [editPencilValue, setEditPencilValue] = useState('');

  useEffect(() => { setMounted(true); }, []);

  // Check saved admin session
  useEffect(() => {
    if (mounted) {
      const saved = localStorage.getItem('sigeuldam_admin');
      if (saved) {
        try { setAdminUser(JSON.parse(saved)); } catch {}
      }
    }
  }, [mounted]);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'x-admin-id': adminUser?.id || '',
  }), [adminUser]);

  // Fetch stats
  useEffect(() => {
    if (!adminUser) return;
    fetch('/api/admin/stats', { headers: { 'x-admin-id': adminUser.id } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {});
  }, [adminUser]);

  // Fetch users
  const fetchUsers = useCallback(async (search = '') => {
    if (!adminUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`, { headers: { 'x-admin-id': adminUser.id } });
      const data = await res.json();
      if (data.users) { setUsers(data.users); setUserTotal(data.total); }
    } catch {} finally { setLoading(false); }
  }, [adminUser]);

  // Fetch poems
  const fetchPoems = useCallback(async (search = '', filter = 'all') => {
    if (!adminUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/poems?search=${encodeURIComponent(search)}&filter=${filter}`, { headers: { 'x-admin-id': adminUser.id } });
      const data = await res.json();
      if (data.poems) { setPoems(data.poems); setPoemTotal(data.total); }
    } catch {} finally { setLoading(false); }
  }, [adminUser]);

  useEffect(() => {
    if (adminUser && activeTab === 'users') fetchUsers(userSearch);
  }, [adminUser, activeTab, fetchUsers, userSearch]);

  useEffect(() => {
    if (adminUser && activeTab === 'poems') fetchPoems(poemSearch, poemFilter);
  }, [adminUser, activeTab, fetchPoems, poemSearch, poemFilter]);

  // Admin login
  const handleLogin = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.error || '로그인 실패'); return; }
      if (!data.user?.isAdmin) { setLoginError('관리자 권한이 없는 계정입니다.'); return; }
      setAdminUser(data.user);
      localStorage.setItem('sigeuldam_admin', JSON.stringify(data.user));
    } catch { setLoginError('서버 연결 실패'); }
    finally { setLoginLoading(false); }
  };

  const handleLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('sigeuldam_admin');
  };

  // User actions
  const userAction = async (userId: string, action: string, value?: any) => {
    setActionMsg('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH', headers: headers(),
        body: JSON.stringify({ userId, action, value }),
      });
      const data = await res.json();
      setActionMsg(data.message || data.error || '완료');
      fetchUsers(userSearch);
      if (stats) {
        fetch('/api/admin/stats', { headers: { 'x-admin-id': adminUser.id } })
          .then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d); });
      }
    } catch { setActionMsg('오류 발생'); }
    setTimeout(() => setActionMsg(''), 3000);
  };

  // Poem actions
  const poemAction = async (poemId: string, action: string) => {
    setActionMsg('');
    try {
      const res = await fetch('/api/admin/poems', {
        method: 'PATCH', headers: headers(),
        body: JSON.stringify({ poemId, action }),
      });
      const data = await res.json();
      setActionMsg(data.message || data.error || '완료');
      fetchPoems(poemSearch, poemFilter);
    } catch { setActionMsg('오류 발생'); }
    setTimeout(() => setActionMsg(''), 3000);
  };

  if (!mounted) return null;

  // Login screen
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-2xl p-8 w-[400px] max-w-[90vw] shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">👑</div>
            <h1 className="text-2xl font-bold text-white">시글담 관리자</h1>
            <p className="text-gray-400 text-sm mt-2">관리자 계정으로 로그인해주세요</p>
          </div>
          <div className="space-y-4">
            <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="관리자 이메일"
              className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <input value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="비밀번호" type="password"
              className="w-full bg-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button onClick={handleLogin} disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50">
              {loginLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>
          <Link href="/" className="block text-center text-gray-500 text-sm mt-6 hover:text-gray-300">← 시글담으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: '대시보드', icon: '📊' },
    { id: 'users' as const, label: '회원 관리', icon: '👥' },
    { id: 'poems' as const, label: '게시글 관리', icon: '📝' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <div>
            <h1 className="font-bold text-lg">시글담 관리자</h1>
            <p className="text-xs text-gray-400">Admin Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">🌸 시글담으로</Link>
          <span className="text-sm text-gray-500">|</span>
          <span className="text-sm text-gray-400">{adminUser.name}</span>
          <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300">로그아웃</button>
        </div>
      </div>

      {/* Action message toast */}
      {actionMsg && (
        <div className="fixed top-20 right-6 z-50 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm shadow-lg animate-pulse">
          {actionMsg}
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className="w-56 min-h-[calc(100vh-64px)] bg-gray-800 border-r border-gray-700 p-4 flex-shrink-0 hidden md:block">
          <nav className="space-y-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${
                  activeTab === t.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex z-40">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-3 text-center ${activeTab === t.id ? 'text-purple-400' : 'text-gray-500'}`}>
              <div className="text-lg">{t.icon}</div>
              <div className="text-[10px]">{t.label}</div>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 pb-24 md:pb-6 overflow-x-hidden">

          {/* ===== OVERVIEW ===== */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-bold mb-6">📊 대시보드 개요</h2>
              {stats ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {[
                      { label: '전체 회원', value: stats.users, icon: '👥', color: 'from-blue-600 to-blue-800' },
                      { label: '인증 회원', value: stats.verifiedUsers, icon: '✅', color: 'from-green-600 to-green-800' },
                      { label: '탈퇴 대기', value: stats.withdrawalPending, icon: '⏳', color: 'from-yellow-600 to-yellow-800' },
                      { label: '전체 시', value: stats.poems, icon: '📝', color: 'from-purple-600 to-purple-800' },
                      { label: '숨긴 시', value: stats.hiddenPoems, icon: '🙈', color: 'from-red-600 to-red-800' },
                    ].map(s => (
                      <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 shadow-lg`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{s.icon}</span>
                          <span className="text-xs text-white/70">{s.label}</span>
                        </div>
                        <p className="text-2xl font-bold">{s.value?.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  {/* Daily chart */}
                  {stats.dailyCounts && Object.keys(stats.dailyCounts).length > 0 && (
                    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 mb-8">
                      <h3 className="font-medium text-gray-300 mb-4">📈 최근 7일 시 작성</h3>
                      <div className="flex items-end gap-2 h-32">
                        {Array.from({ length: 7 }, (_, i) => {
                          const d = new Date(); d.setDate(d.getDate() - (6 - i));
                          const key = d.toISOString().slice(0, 10);
                          const count = stats.dailyCounts[key] || 0;
                          const max = Math.max(...Object.values(stats.dailyCounts as Record<string, number>), 1);
                          return (
                            <div key={key} className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-gray-700 rounded-t-md relative" style={{ height: '100px' }}>
                                <div className="absolute bottom-0 left-0 right-0 bg-purple-500 rounded-t-md" style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? '4px' : '0' }} />
                              </div>
                              <span className="text-[10px] text-gray-500">{key.slice(5)}</span>
                              <span className="text-xs text-gray-400">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <button onClick={() => setActiveTab('users')} className="bg-blue-900/30 border border-blue-800 rounded-xl p-4 text-center hover:bg-blue-900/50">
                      <div className="text-2xl mb-1">👥</div>
                      <p className="text-sm text-blue-300">회원 관리</p>
                    </button>
                    <button onClick={() => setActiveTab('poems')} className="bg-purple-900/30 border border-purple-800 rounded-xl p-4 text-center hover:bg-purple-900/50">
                      <div className="text-2xl mb-1">📝</div>
                      <p className="text-sm text-purple-300">게시글 관리</p>
                    </button>
                    <Link href="/" className="bg-green-900/30 border border-green-800 rounded-xl p-4 text-center hover:bg-green-900/50 block">
                      <div className="text-2xl mb-1">🌸</div>
                      <p className="text-sm text-green-300">시글담 바로가기</p>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">데이터 로딩 중...</div>
              )}
            </div>
          )}

          {/* ===== USERS ===== */}
          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">👥 회원 관리</h2>
                <span className="text-sm text-gray-400">총 {userTotal}명</span>
              </div>
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="이름, 이메일 검색..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-6" />

              {loading ? (
                <div className="text-center py-12 text-gray-500">로딩 중...</div>
              ) : (
                <div className="space-y-3">
                  {users.map(u => {
                    const isWithdrawing = !!u.withdrawal_requested_at;
                    let daysLeft = 0;
                    if (isWithdrawing) {
                      const d = Math.floor((Date.now() - new Date(u.withdrawal_requested_at).getTime()) / 86400000);
                      daysLeft = 15 - d;
                    }
                    return (
                      <div key={u.id} className={`rounded-xl p-4 border ${isWithdrawing ? 'bg-red-900/20 border-red-800' : 'bg-gray-800 border-gray-700'}`}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl flex-shrink-0">{u.avatar || '🌸'}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-white">{u.name}</h4>
                              {u.is_admin && <span className="text-[10px] bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full">관리자</span>}
                              {u.is_email_verified ? <span className="text-[10px] bg-green-900 text-green-300 px-2 py-0.5 rounded-full">인증</span> : <span className="text-[10px] bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full">미인증</span>}
                              {u.provider && u.provider !== 'email' && <span className="text-[10px] bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">{u.provider}</span>}
                              {isWithdrawing && <span className="text-[10px] bg-red-900 text-red-300 px-2 py-0.5 rounded-full">탈퇴 대기 (D-{daysLeft})</span>}
                            </div>
                            <p className="text-sm text-gray-400">{u.email}</p>
                            <div className="flex gap-4 mt-1 text-xs text-gray-400">
                              <span>✏️ {u.pencils || 0}자루</span>
                              <span>🎁 {u.referral_code || '-'}</span>
                              <span>가입: {new Date(u.created_at).toLocaleDateString('ko-KR')}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 flex-shrink-0">
                            <button onClick={() => { setEditPencilUser(u); setEditPencilValue(String(u.pencils || 0)); }}
                              className="text-xs px-3 py-1.5 bg-purple-900 text-purple-300 rounded-lg hover:bg-purple-800">연필 수정</button>
                            {isWithdrawing ? (
                              <button onClick={() => userAction(u.id, 'cancel_withdraw')}
                                className="text-xs px-3 py-1.5 bg-green-900 text-green-300 rounded-lg hover:bg-green-800">탈퇴 취소</button>
                            ) : (
                              !u.is_admin && <button onClick={() => { if (confirm(`${u.name}님을 강제 탈퇴 처리하시겠습니까?`)) userAction(u.id, 'force_withdraw'); }}
                                className="text-xs px-3 py-1.5 bg-red-900 text-red-300 rounded-lg hover:bg-red-800">강제 탈퇴</button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== POEMS ===== */}
          {activeTab === 'poems' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">📝 게시글 관리</h2>
                <span className="text-sm text-gray-400">총 {poemTotal}건</span>
              </div>
              <div className="flex flex-col md:flex-row gap-3 mb-6">
                <input value={poemSearch} onChange={e => setPoemSearch(e.target.value)} placeholder="제목, 작성자, 내용 검색..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <div className="flex gap-2">
                  {[{ v: 'all', l: '전체' }, { v: 'hidden', l: '숨김' }, { v: 'reported', l: '신고' }].map(f => (
                    <button key={f.v} onClick={() => setPoemFilter(f.v)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium ${poemFilter === f.v ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                      {f.l}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500">로딩 중...</div>
              ) : (
                <div className="space-y-3">
                  {poems.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500 border border-gray-700">조건에 맞는 게시글이 없습니다.</div>
                  ) : poems.map(p => (
                    <div key={p.id} className={`rounded-xl p-4 border ${p.is_hidden ? 'bg-red-900/20 border-red-800' : 'bg-gray-800 border-gray-700'}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-white">{p.title || '무제'}</h4>
                            {p.is_hidden && <span className="text-[10px] bg-red-900 text-red-300 px-2 py-0.5 rounded-full">숨김</span>}
                            {p.is_auto_generated && <span className="text-[10px] bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full">AI</span>}
                          </div>
                          <p className="text-sm text-gray-400 mt-0.5">by {p.author_name}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.content}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-400">
                            <span>❤️ {p.likes || 0}</span>
                            <span>👀 {p.views || 0}</span>
                            <span>{new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          {p.is_hidden ? (
                            <button onClick={() => poemAction(p.id, 'unhide')} className="text-xs px-3 py-1.5 bg-green-900 text-green-300 rounded-lg hover:bg-green-800">복원</button>
                          ) : (
                            <button onClick={() => poemAction(p.id, 'hide')} className="text-xs px-3 py-1.5 bg-yellow-900 text-yellow-300 rounded-lg hover:bg-yellow-800">숨기기</button>
                          )}
                          <button onClick={() => { if (confirm('정말 삭제하시겠습니까?')) poemAction(p.id, 'delete'); }}
                            className="text-xs px-3 py-1.5 bg-red-900 text-red-300 rounded-lg hover:bg-red-800">삭제</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pencil Edit Modal */}
      {editPencilUser && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={() => setEditPencilUser(null)}>
          <div className="bg-gray-800 rounded-2xl w-[90%] max-w-[400px] p-6 border border-gray-700" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white text-lg mb-2">✏️ 연필 수정</h3>
            <p className="text-sm text-gray-400 mb-4">{editPencilUser.name} ({editPencilUser.email})</p>
            <p className="text-xs text-gray-500 mb-2">현재: {editPencilUser.pencils || 0}자루</p>

            {/* Quick add/subtract buttons */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[-10, -5, -1, 0].map(n => (
                <button key={`sub${n}`} onClick={() => setEditPencilValue(String(Math.max(0, (parseInt(editPencilValue) || 0) + n)))}
                  className={`py-2 rounded-lg text-sm font-medium ${n === 0 ? 'bg-gray-600 text-gray-300' : 'bg-red-900/50 text-red-300 hover:bg-red-900/70'}`}>
                  {n === 0 ? '0' : n}
                </button>
              ))}
              {[1, 5, 10, 50].map(n => (
                <button key={`add${n}`} onClick={() => setEditPencilValue(String((parseInt(editPencilValue) || 0) + n))}
                  className="py-2 rounded-lg text-sm font-medium bg-green-900/50 text-green-300 hover:bg-green-900/70">
                  +{n}
                </button>
              ))}
            </div>

            {/* Direct input */}
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setEditPencilValue(String(Math.max(0, (parseInt(editPencilValue) || 0) - 1)))}
                className="w-10 h-10 rounded-xl bg-red-900/50 text-red-300 text-xl font-bold hover:bg-red-900/70 flex-shrink-0">−</button>
              <input value={editPencilValue} onChange={e => setEditPencilValue(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="연필 수량" type="number"
                className="flex-1 bg-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <button onClick={() => setEditPencilValue(String((parseInt(editPencilValue) || 0) + 1))}
                className="w-10 h-10 rounded-xl bg-green-900/50 text-green-300 text-xl font-bold hover:bg-green-900/70 flex-shrink-0">+</button>
            </div>

            <p className="text-center text-sm text-gray-400 mb-4">
              변경: <span className="text-white font-bold">{editPencilUser.pencils || 0}</span> → <span className="text-purple-400 font-bold">{editPencilValue || 0}</span>자루
              {(parseInt(editPencilValue) || 0) !== (editPencilUser.pencils || 0) && (
                <span className={`ml-2 ${(parseInt(editPencilValue) || 0) > (editPencilUser.pencils || 0) ? 'text-green-400' : 'text-red-400'}`}>
                  ({(parseInt(editPencilValue) || 0) > (editPencilUser.pencils || 0) ? '+' : ''}{(parseInt(editPencilValue) || 0) - (editPencilUser.pencils || 0)})
                </span>
              )}
            </p>

            <div className="flex gap-3">
              <button onClick={() => setEditPencilUser(null)} className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300">취소</button>
              <button onClick={() => { userAction(editPencilUser.id, 'set_pencils', parseInt(editPencilValue) || 0); setEditPencilUser(null); }}
                className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-medium">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
