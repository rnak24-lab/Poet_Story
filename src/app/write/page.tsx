'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { flowers, getFlowerById } from '@/data/flowers';
import { partBPrompts } from '@/data/prompts';
import { partCBase, partCOptions, partCFreeMessage } from '@/data/prompts';
import { v4 as uuidv4 } from 'uuid';
import type { PoemDraft, SentenceItem, WritingDraft } from '@/store/useAppStore';

export default function WritePage() {
  return (
    <Suspense fallback={<WritingLoader />}>
      <WritePageContent />
    </Suspense>
  );
}

function WritePageContent() {
  const { currentPhase, qaItems, partBText, partCText, finalPoem, selectedFlowerId, saveDraft, isLoggedIn, user } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitAction, setExitAction] = useState<(() => void) | null>(null);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  // Login guard
  if (mounted && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-[340px]">
          <div className="text-5xl mb-4">✏️</div>
          <h2 className="text-xl font-bold text-ink-700 mb-2">로그인이 필요해요</h2>
          <p className="text-sm text-ink-400 leading-relaxed mb-6">
            시를 쓰려면 먼저 로그인해주세요.<br/>
            내가 쓴 시를 저장하고 관리할 수 있어요!
          </p>
          <button onClick={() => router.push('/profile')}
            className="w-full py-3.5 rounded-2xl bg-ink-700 text-white font-medium hover:bg-ink-600 transition-colors mb-3">
            로그인하러 가기
          </button>
          <button onClick={() => router.push('/')}
            className="w-full py-3 rounded-2xl bg-cream-100 text-ink-500 font-medium text-sm">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // Has user written anything worth saving?
  const hasUnsavedWork = qaItems.length > 0 || partBText.trim() || partCText.trim() || finalPoem.trim();

  // Browser back / close warning
  useEffect(() => {
    if (!hasUnsavedWork) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedWork]);

  // Intercept browser back button
  useEffect(() => {
    if (!hasUnsavedWork || currentPhase === 'select-flower') return;
    const handlePopState = (e: PopStateEvent) => {
      // Push state back to prevent actual navigation
      window.history.pushState(null, '', window.location.href);
      setExitAction(() => () => router.push('/'));
      setShowExitConfirm(true);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasUnsavedWork, currentPhase, router]);

  const handleTryExit = useCallback((action: () => void) => {
    if (hasUnsavedWork && currentPhase !== 'select-flower') {
      setExitAction(() => action);
      setShowExitConfirm(true);
    } else {
      action();
    }
  }, [hasUnsavedWork, currentPhase]);

  const handleExitSaveAndGo = () => {
    saveDraft();
    setShowExitConfirm(false);
    if (exitAction) exitAction();
  };

  const handleExitDiscard = () => {
    setShowExitConfirm(false);
    if (exitAction) exitAction();
  };

  if (!mounted) return <WritingLoader />;

  return (
    <div className="min-h-screen bg-white">
      {currentPhase === 'select-flower' && <FlowerSelectPhase />}
      {currentPhase === 'part-a' && <PartAPhase onTryExit={handleTryExit} />}
      {currentPhase === 'part-b' && <PartBPhase onTryExit={handleTryExit} />}
      {currentPhase === 'part-c' && <PartCPhase onTryExit={handleTryExit} />}
      {currentPhase === 'finalize' && <FinalizePhase onTryExit={handleTryExit} />}

      {/* Exit Confirm Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[70] modal-overlay flex items-center justify-center" onClick={() => setShowExitConfirm(false)}>
          <div className="bg-white rounded-card w-[90%] max-w-[360px] p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="font-bold text-ink-700 text-lg">정말 나가시겠어요?</h3>
              <p className="text-sm text-ink-400 mt-2 leading-relaxed">
                지금 나가면 쓰고 있던 내용을<br/>잃어버릴 수 있어요.
              </p>
            </div>
            <div className="space-y-2">
              <button onClick={handleExitSaveAndGo}
                className="w-full py-3 rounded-xl bg-ink-700 text-white font-medium">
                💾 임시저장하고 나가기
              </button>
              <button onClick={handleExitDiscard}
                className="w-full py-3 rounded-xl bg-red-50 text-red-500 font-medium">
                저장 안 하고 나가기
              </button>
              <button onClick={() => setShowExitConfirm(false)}
                className="w-full py-2.5 text-sm text-ink-300">
                계속 쓰기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Temp Save Button (우측 상단) ===== */
function TempSaveButton() {
  const { saveDraft } = useAppStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveDraft();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <button onClick={handleSave}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        saved ? 'bg-sage-100 text-sage-600' : 'bg-cream-50 text-ink-400 hover:bg-cream-100'
      }`}>
      {saved ? '✅ 저장됨' : '💾 임시저장'}
    </button>
  );
}

function WritingLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3 gentle-float">✏️</div>
        <p className="text-ink-400">글감을 준비하고 있어요...</p>
      </div>
    </div>
  );
}

/* ======================== FLOWER SELECT ======================== */
function FlowerSelectPhase() {
  const { selectFlower, setPhase, authorName, setAuthorName, writingLength, setWritingLength, initQuestionFlow, resetWritingSession, writingDrafts, loadDraft, deleteDraft, user } = useAppStore();
  const [name, setName] = useState(authorName || '');
  const searchParams = useSearchParams();
  const preselectedFlower = searchParams.get('flower');
  const [selectedId, setSelectedId] = useState<string | null>(preselectedFlower);
  const [showDrafts, setShowDrafts] = useState(false);
  const router = useRouter();
  useEffect(() => { resetWritingSession(); }, []);

  const myDrafts = writingDrafts.filter(d => d.userId === (user?.id || 'anonymous'));

  const handleStart = () => {
    if (!selectedId || !name.trim()) return;
    setAuthorName(name.trim());
    selectFlower(selectedId);
    setTimeout(() => { initQuestionFlow(); setPhase('part-a'); }, 50);
  };

  const handleLoadDraft = (draftId: string) => {
    const ok = loadDraft(draftId);
    if (ok) setShowDrafts(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}시간 전`;
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const phaseLabel = (phase: string) => {
    const labels: Record<string, string> = { 'part-a': 'A파트', 'part-b': 'B파트', 'part-c': 'C파트', 'finalize': '완성 단계' };
    return labels[phase] || phase;
  };

  return (
    <div className="min-h-screen pb-12">
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push('/')} className="text-ink-300 text-sm">← 홈으로</button>
          {myDrafts.length > 0 && (
            <button onClick={() => setShowDrafts(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-100 text-warm-600 text-xs font-medium hover:bg-warm-200 transition-colors">
              📂 임시저장 ({myDrafts.length})
            </button>
          )}
        </div>
        <h1 className="text-3xl font-bold text-ink-700 leading-tight">오늘의<br/>글감</h1>
        <p className="text-ink-400 mt-2 text-sm">꽃말을 따라 시를 써볼까요?</p>
      </div>
      <div className="px-6 mb-6">
        <label className="text-sm text-ink-500 font-medium mb-2 block">작성자 이름</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 또는 필명을 입력해주세요"
          className="w-full bg-cream-50 rounded-xl px-4 py-3 text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-warm-300" />
      </div>
      <div className="px-6 mb-6">
        <label className="text-sm text-ink-500 font-medium mb-2 block">글쓰기 분량</label>
        <div className="flex gap-2">
          {(['short', 'medium', 'long'] as const).map(len => (
            <button key={len} onClick={() => setWritingLength(len)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${writingLength === len ? 'bg-ink-700 text-white' : 'bg-cream-50 text-ink-400 hover:bg-cream-100'}`}>
              {len === 'short' ? '짧게' : len === 'medium' ? '보통' : '길게'}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-300 mt-2">{writingLength === 'short' ? '질문 약 10개' : writingLength === 'medium' ? '질문 약 13개' : '질문 약 17개'}</p>
      </div>
      <div className="px-6 mb-8">
        <label className="text-sm text-ink-500 font-medium mb-3 block">꽃을 선택해주세요</label>
        <div className="grid grid-cols-2 gap-3">
          {flowers.map(flower => (
            <button key={flower.id} onClick={() => setSelectedId(flower.id)}
              className={`flower-card p-4 rounded-card text-left transition-all ${selectedId === flower.id ? 'ring-2 ring-ink-600 bg-white shadow-md' : 'bg-cream-50 hover:bg-cream-100'}`}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: flower.color + '22' }}>{flower.emoji}</div>
              <h3 className="font-bold text-ink-700 text-sm">{flower.name}</h3>
              <p className="text-xs text-ink-400 mt-0.5">{flower.meaning}</p>
            </button>
          ))}
        </div>
      </div>
      {selectedId && (
        <div className="px-6 mb-8 animate-fade-in">
          <div className="bg-cream-100 rounded-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getFlowerById(selectedId)?.emoji}</span>
              <div>
                <h3 className="font-bold text-ink-700">{getFlowerById(selectedId)?.name}</h3>
                <p className="text-xs text-ink-400">{getFlowerById(selectedId)?.meaning}</p>
              </div>
            </div>
            <p className="text-sm text-ink-500 leading-relaxed">{getFlowerById(selectedId)?.description}</p>
          </div>
        </div>
      )}
      <div className="px-6">
        <button onClick={handleStart} disabled={!selectedId || !name.trim()}
          className={`w-full py-4 rounded-2xl font-medium text-lg transition-all ${selectedId && name.trim() ? 'bg-ink-700 text-white hover:bg-ink-600' : 'bg-ink-100 text-ink-300 cursor-not-allowed'}`}>
          시 쓰기 시작 ✏️
        </button>
      </div>

      {/* Drafts Modal */}
      {showDrafts && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center" onClick={() => setShowDrafts(false)}>
          <div className="bg-white rounded-card w-[90%] max-w-[400px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-cream-200 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-ink-700 text-lg">📂 임시저장 목록</h3>
              <button onClick={() => setShowDrafts(false)} className="text-ink-300 hover:text-ink-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {myDrafts.length === 0 ? (
                <p className="text-center text-ink-300 py-8">임시저장된 글이 없어요</p>
              ) : (
                myDrafts.map(draft => (
                  <div key={draft.id} className="bg-cream-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{draft.flowerEmoji}</span>
                      <div className="flex-1">
                        <p className="font-medium text-ink-700 text-sm">{draft.flowerName || '꽃 미선택'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warm-100 text-warm-600">{phaseLabel(draft.currentPhase)}</span>
                          <span className="text-[10px] text-ink-300">{formatDate(draft.savedAt)}</span>
                        </div>
                      </div>
                    </div>
                    {draft.qaItems.length > 0 && (
                      <p className="text-xs text-ink-400 mb-2 line-clamp-1">
                        답변 {draft.qaItems.length}개 · {draft.qaItems[0]?.answer?.slice(0, 30)}...
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => handleLoadDraft(draft.id)}
                        className="flex-1 py-2 rounded-lg bg-ink-700 text-white text-xs font-medium">
                        이어서 쓰기
                      </button>
                      <button onClick={() => deleteDraft(draft.id)}
                        className="px-3 py-2 rounded-lg bg-red-50 text-red-400 text-xs font-medium hover:bg-red-100">
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-cream-200 flex-shrink-0">
              <button onClick={() => setShowDrafts(false)} className="w-full py-2.5 rounded-xl bg-cream-100 text-ink-500 text-sm font-medium">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================== PART A ======================== */
function PartAPhase({ onTryExit }: { onTryExit: (action: () => void) => void }) {
  const { questionFlow, currentQuestionIndex, qaItems, answerQuestion, nextQuestion, prevQuestion, setPhase, authorName, selectedFlowerId } = useAppStore();
  const [answer, setAnswer] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const flower = getFlowerById(selectedFlowerId || '');
  const currentQ = questionFlow[currentQuestionIndex];
  const existingAnswer = qaItems.find(item => item.questionId === currentQ?.question.id);
  const progress = ((currentQuestionIndex + 1) / questionFlow.length) * 100;

  useEffect(() => { setAnswer(existingAnswer?.answer || ''); }, [currentQuestionIndex, existingAnswer]);
  useEffect(() => { textareaRef.current?.focus(); }, [currentQuestionIndex]);

  const handleNext = () => {
    if (!answer.trim()) return;
    answerQuestion(answer.trim());
    if (currentQuestionIndex === questionFlow.length - 1) setPhase('part-b');
    else nextQuestion();
  };

  const questionText = currentQ?.question.text.replace(/\[작성자\]/g, authorName) || '';
  const phaseLabel = { start: '시작', surprise1: '돌발', middle: '중간', surprise2: '돌발', end: '마무리' }[currentQ?.phase || 'start'];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-6 pt-6 pb-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => { if (currentQuestionIndex > 0) prevQuestion(); else onTryExit(() => router.push('/')); }} className="text-ink-300 text-sm">{currentQuestionIndex > 0 ? '← 이전' : '← 나가기'}</button>
          <div className="flex items-center gap-2"><span className="text-lg">{flower?.emoji}</span><span className="text-xs text-ink-400">{flower?.name}</span></div>
          <TempSaveButton />
        </div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-ink-300">{currentQuestionIndex + 1}/{questionFlow.length}</span>
        </div>
        <div className="w-full h-1 bg-cream-100 rounded-full overflow-hidden"><div className="h-full bg-ink-600 rounded-full progress-bar" style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="px-6 py-2">
        <span className={`text-xs px-3 py-1 rounded-full ${currentQ?.phase?.includes('surprise') ? 'bg-warm-200 text-warm-600' : 'bg-cream-100 text-ink-400'}`}>{phaseLabel}</span>
        <span className="text-xs text-ink-300 ml-2">{currentQ?.question.label}</span>
      </div>
      <div className="px-6 py-4 flex-shrink-0">
        <div className="bg-cream-100 rounded-card p-5 bubble-in" key={currentQuestionIndex}>
          <p className="text-ink-600 leading-relaxed text-[15px]">{questionText}</p>
        </div>
      </div>
      <div className="flex-1 px-6 pb-4">
        <textarea ref={textareaRef} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="여기에 답을 적어주세요..."
          className="writing-area w-full bg-transparent text-ink-600 placeholder:text-ink-200 leading-relaxed" />
      </div>
      <div className="px-6 pb-8 flex-shrink-0">
        <button onClick={handleNext} disabled={!answer.trim()}
          className={`w-full py-4 rounded-2xl font-medium transition-all ${answer.trim() ? 'bg-ink-700 text-white hover:bg-ink-600' : 'bg-ink-100 text-ink-300 cursor-not-allowed'}`}>
          {currentQuestionIndex === questionFlow.length - 1 ? '다음 단계로 →' : '다음 질문 →'}
        </button>
      </div>
    </div>
  );
}

/* ======================== PART B — 키워드 풍선 → 문장 만들기 ======================== */
function PartBPhase({ onTryExit }: { onTryExit: (action: () => void) => void }) {
  const {
    qaItems, sentences, setSentences, updateSentence, addSentence, removeSentence,
    partBText, setPartBText, partBPromptIndex, nextPartBPrompt,
    setPhase, authorName, selectedFlowerId, editAnswer,
  } = useAppStore();
  const router = useRouter();

  const [step, setStep] = useState<'bubbles' | 'sentences' | 'compose'>('bubbles');
  const [showReview, setShowReview] = useState(false);
  const [selectedQA, setSelectedQA] = useState<string | null>(null);
  const [editingAnswer, setEditingAnswer] = useState('');
  const [selectedBubbles, setSelectedBubbles] = useState<Set<string>>(new Set());
  const [currentSentenceEdit, setCurrentSentenceEdit] = useState<string | null>(null);
  const flower = getFlowerById(selectedFlowerId || '');
  const currentPrompt = partBPrompts[Math.min(partBPromptIndex, partBPrompts.length - 1)];

  // Initialize sentences from qaItems if empty
  useEffect(() => {
    if (sentences.length === 0 && qaItems.length > 0) {
      const initial: SentenceItem[] = qaItems.map(qa => ({
        id: `sent-${qa.questionId}`,
        keywords: [qa.questionLabel],
        sentence: '',
        sourceQAIds: [qa.questionId],
      }));
      setSentences(initial);
    }
  }, [qaItems]);

  const handleBubbleToggle = (qaId: string) => {
    const newSet = new Set(selectedBubbles);
    if (newSet.has(qaId)) newSet.delete(qaId);
    else newSet.add(qaId);
    setSelectedBubbles(newSet);
  };

  const handleCreateSentenceFromBubbles = () => {
    if (selectedBubbles.size === 0) return;
    const selectedQAs = qaItems.filter(qa => selectedBubbles.has(qa.questionId));
    const keywords = selectedQAs.map(qa => qa.questionLabel);
    const newSentence: SentenceItem = {
      id: `sent-${Date.now()}`,
      keywords,
      sentence: '',
      sourceQAIds: selectedQAs.map(qa => qa.questionId),
    };
    addSentence(newSentence);
    setSelectedBubbles(new Set());
    setCurrentSentenceEdit(newSentence.id);
    setStep('sentences');
  };

  const handleSentenceDone = () => {
    const text = sentences.filter(s => s.sentence.trim()).map(s => s.sentence.trim()).join('\n');
    setPartBText(text);
    setStep('compose');
  };

  const handleEditSave = (questionId: string) => {
    editAnswer(questionId, editingAnswer);
    setSelectedQA(null);
  };

  const filledSentences = sentences.filter(s => s.sentence.trim());

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Top bar */}
      <div className="px-6 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setPhase('part-a')} className="text-sm text-ink-400 hover:text-ink-600">
            ← A파트로
          </button>
          <div className="flex items-center gap-2">
            <span>{flower?.emoji}</span>
            <span className="text-xs text-ink-400">B파트 — {step === 'bubbles' ? '단어 고르기' : step === 'sentences' ? '문장 만들기' : '다듬기'}</span>
          </div>
          <TempSaveButton />
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={() => setShowReview(true)} className="text-xs text-ink-400 bg-cream-50 px-2.5 py-1 rounded-lg hover:bg-cream-100">
            📋 되돌아보기
          </button>
          <div className="flex-1" />
          <button onClick={() => setPhase('part-c')} className="text-xs text-ink-300 hover:text-ink-500">건너뛰기 →</button>
        </div>
        {/* Step indicator */}
        <div className="flex gap-1 mt-3">
          {['bubbles', 'sentences', 'compose'].map((s, i) => (
            <div key={s} className={`flex-1 h-1 rounded-full ${
              s === step ? 'bg-ink-600' : i < ['bubbles', 'sentences', 'compose'].indexOf(step) ? 'bg-ink-400' : 'bg-cream-200'
            }`} />
          ))}
        </div>
      </div>

      {/* ===== STEP 1: Keyword Bubbles ===== */}
      {step === 'bubbles' && (
        <>
          <div className="px-6 py-3">
            <div className="bg-cream-100 rounded-card p-4 bubble-in">
              <p className="text-ink-600 text-[15px] leading-relaxed">
                A파트에서 쏟아낸 대표 단어들이에요! 🫧<br/>
                <span className="text-ink-400 text-sm">하나 또는 두 개의 단어를 골라서 문장으로 바꿔볼까요?</span>
              </p>
            </div>
          </div>

          <div className="flex-1 px-6 py-4 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {qaItems.map(qa => {
                const isSelected = selectedBubbles.has(qa.questionId);
                return (
                  <button
                    key={qa.questionId}
                    onClick={() => handleBubbleToggle(qa.questionId)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all bubble-in ${
                      isSelected
                        ? 'bg-ink-700 text-white shadow-md scale-105'
                        : 'bg-cream-50 text-ink-500 hover:bg-cream-100 hover:shadow-sm'
                    }`}
                  >
                    {qa.questionLabel}
                    {isSelected && <span className="ml-1">✓</span>}
                  </button>
                );
              })}
            </div>
            {selectedBubbles.size > 0 && (
              <div className="mt-4 p-3 bg-warm-100 rounded-xl bubble-in">
                <p className="text-xs text-ink-400 mb-1">선택한 단어:</p>
                <p className="text-sm text-ink-600 font-medium">
                  {qaItems.filter(qa => selectedBubbles.has(qa.questionId)).map(qa => qa.questionLabel).join(' + ')}
                </p>
                <p className="text-xs text-ink-300 mt-1">
                  답변: {qaItems.filter(qa => selectedBubbles.has(qa.questionId)).map(qa => `"${qa.answer.slice(0, 30)}${qa.answer.length > 30 ? '...' : ''}"`).join(', ')}
                </p>
              </div>
            )}
            {filledSentences.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-ink-400 mb-2">만들어진 문장들 ({filledSentences.length})</p>
                <div className="space-y-2">
                  {filledSentences.map(s => (
                    <div key={s.id} className="bg-cream-50 rounded-xl p-3 text-sm text-ink-600">
                      <span className="text-xs text-warm-500">{s.keywords.join(' · ')}</span>
                      <p className="mt-1">{s.sentence}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 pb-8 space-y-3 flex-shrink-0">
            <button onClick={handleCreateSentenceFromBubbles} disabled={selectedBubbles.size === 0}
              className={`w-full py-3 rounded-2xl font-medium transition-all ${selectedBubbles.size > 0 ? 'bg-warm-400 text-white hover:bg-warm-500' : 'bg-ink-100 text-ink-300 cursor-not-allowed'}`}>
              이 단어로 문장 만들기 →
            </button>
            {filledSentences.length >= 2 && (
              <button onClick={handleSentenceDone} className="w-full py-4 rounded-2xl bg-ink-700 text-white font-medium hover:bg-ink-600 transition-colors">
                문장 완성! 다듬기로 →
              </button>
            )}
          </div>
        </>
      )}

      {/* ===== STEP 2: Sentence Editing ===== */}
      {step === 'sentences' && (
        <>
          <div className="px-6 py-3">
            <div className="bg-cream-100 rounded-card p-4 bubble-in">
              <p className="text-ink-600 text-[15px] leading-relaxed">
                선택한 단어를 문장으로 바꿔보세요 ✍️<br/>
                <span className="text-ink-400 text-sm">A파트의 답변을 참고하면서 자유롭게 써보세요.</span>
              </p>
            </div>
          </div>

          <div className="flex-1 px-6 py-4 overflow-y-auto space-y-3">
            {sentences.map(s => {
              const isEditing = currentSentenceEdit === s.id;
              const sourceAnswers = qaItems.filter(qa => s.sourceQAIds.includes(qa.questionId));
              return (
                <div key={s.id} className={`rounded-card p-4 transition-all ${isEditing ? 'bg-warm-50 ring-2 ring-warm-300' : 'bg-cream-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1 flex-wrap">
                      {s.keywords.map(k => (
                        <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-warm-200 text-warm-600">{k}</span>
                      ))}
                    </div>
                    <div className="ml-auto flex gap-1">
                      <button onClick={() => setCurrentSentenceEdit(isEditing ? null : s.id)} className="text-xs text-ink-400 hover:text-ink-600">
                        {isEditing ? '접기' : '편집'}
                      </button>
                      {s.sentence.trim() && (
                        <button onClick={() => removeSentence(s.id)} className="text-xs text-red-400 hover:text-red-600 ml-2">삭제</button>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="bubble-in">
                      <div className="mb-3 space-y-1">
                        {sourceAnswers.map(qa => (
                          <div key={qa.questionId} className="text-xs bg-white rounded-lg p-2">
                            <span className="text-ink-300">{qa.questionLabel}:</span>{' '}
                            <span className="text-ink-500">{qa.answer}</span>
                          </div>
                        ))}
                      </div>
                      <textarea
                        value={s.sentence}
                        onChange={(e) => updateSentence(s.id, e.target.value)}
                        placeholder="이 단어에서 떠오르는 문장을 적어보세요..."
                        className="w-full bg-white rounded-xl p-3 text-sm text-ink-600 placeholder:text-ink-200 focus:outline-none focus:ring-1 focus:ring-warm-300 resize-none min-h-[80px]"
                        autoFocus
                      />
                    </div>
                  )}
                  {!isEditing && s.sentence.trim() && (
                    <p className="text-sm text-ink-600 leading-relaxed">{s.sentence}</p>
                  )}
                  {!isEditing && !s.sentence.trim() && (
                    <p className="text-sm text-ink-300 italic">아직 문장이 없어요. 편집을 눌러주세요.</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-6 pb-8 space-y-3 flex-shrink-0">
            <button onClick={() => setStep('bubbles')} className="w-full py-3 rounded-2xl bg-cream-100 text-ink-500 font-medium text-sm">
              ← 더 많은 단어 고르기
            </button>
            <button onClick={handleSentenceDone}
              className="w-full py-4 rounded-2xl bg-ink-700 text-white font-medium hover:bg-ink-600 transition-colors">
              문장 다듬기로 →
            </button>
          </div>
        </>
      )}

      {/* ===== STEP 3: Compose / Refine ===== */}
      {step === 'compose' && (
        <>
          <div className="px-6 py-3">
            <div className="bg-cream-100 rounded-card p-4 bubble-in" key={partBPromptIndex}>
              <span className="text-xs text-warm-500 font-medium mb-1 block">{currentPrompt.label}</span>
              <p className="text-ink-600 text-[15px] leading-relaxed">{currentPrompt.text}</p>
            </div>
          </div>

          <div className="flex-1 px-6 py-4">
            <textarea value={partBText} onChange={(e) => setPartBText(e.target.value)} placeholder="문장들을 자유롭게 다듬어 보세요..."
              className="writing-area w-full h-full bg-transparent text-ink-600 placeholder:text-ink-200 leading-[2] text-left" />
          </div>

          <div className="px-6 pb-8 space-y-3 flex-shrink-0">
            <div className="flex gap-2">
              <button onClick={() => setStep('bubbles')} className="flex-1 py-2.5 rounded-xl bg-cream-50 text-ink-400 text-sm font-medium">
                ← 단어 더 고르기
              </button>
              <button onClick={() => { if (partBPromptIndex < partBPrompts.length - 1) nextPartBPrompt(); }}
                className="flex-1 py-2.5 rounded-xl bg-cream-100 text-ink-500 text-sm font-medium">
                다음 팁 💡
              </button>
            </div>
            <button onClick={() => setPhase('part-c')} className="w-full py-4 rounded-2xl bg-ink-700 text-white font-medium hover:bg-ink-600 transition-colors">
              연 단위로 다듬기 →
            </button>
          </div>
        </>
      )}

      {/* Review Overlay */}
      {showReview && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center" onClick={() => { setShowReview(false); setSelectedQA(null); }}>
          <div className="bg-white rounded-card max-w-[400px] w-[90%] max-h-[80vh] overflow-y-auto p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-ink-700 text-lg mb-4">A파트 되돌아보기</h3>
            <div className="space-y-2">
              {qaItems.map(item => (
                <div key={item.questionId}>
                  <button onClick={() => { setSelectedQA(selectedQA === item.questionId ? null : item.questionId); setEditingAnswer(item.answer); }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${selectedQA === item.questionId ? 'bg-warm-100 text-ink-600' : 'bg-cream-50 text-ink-500 hover:bg-cream-100'}`}>
                    <span className="font-medium">{item.questionLabel}</span>
                  </button>
                  {selectedQA === item.questionId && (
                    <div className="mt-2 ml-4 space-y-2 bubble-in">
                      <div className="bg-cream-100 rounded-xl p-3">
                        <p className="text-xs text-ink-400 mb-1">질문</p>
                        <p className="text-sm text-ink-600">{item.questionText.replace(/\[작성자\]/g, authorName)}</p>
                      </div>
                      <div className="bg-white border border-cream-200 rounded-xl p-3">
                        <p className="text-xs text-ink-400 mb-1">답변 (수정 가능)</p>
                        <textarea value={editingAnswer} onChange={(e) => setEditingAnswer(e.target.value)}
                          className="w-full text-sm text-ink-600 bg-transparent resize-none focus:outline-none min-h-[60px]" />
                        <button onClick={() => handleEditSave(item.questionId)} className="mt-2 text-xs bg-ink-700 text-white px-3 py-1.5 rounded-lg">저장</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => { setShowReview(false); setSelectedQA(null); }} className="w-full mt-4 py-3 rounded-xl bg-cream-100 text-ink-500 font-medium">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================== PART C — 연 단위 + 운율 ======================== */
function PartCPhase({ onTryExit }: { onTryExit: (action: () => void) => void }) {
  const { partBText, partCText, setPartCText, partCRejections, rejectPartCOption, showFreeMessage, setPhase, sentences } = useAppStore();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showBase, setShowBase] = useState(true);
  const [stanzas, setStanzas] = useState<string[]>(['']);
  const [showRhythmHelper, setShowRhythmHelper] = useState(false);
  const [showBSentences, setShowBSentences] = useState(false);

  const stanzaTips = [
    { label: '연 나누기', text: '문장들을 연(스탠자)으로 나눠볼까요? 한 연에 2~4행이 들어가면 호흡이 좋아요. 빈 줄로 연을 구분합니다.' },
    { label: '운율 맞추기', text: '각 행의 글자 수를 비슷하게 맞춰보세요. 예: 3-4-3-4 리듬이면 "봄이 와서 / 꽃이 피고 / 새가 울어 / 봄이 깊다" 처럼요.' },
    { label: '반복과 변주', text: '같은 구조의 문장을 반복하면 리듬감이 생겨요. "~처럼", "~같은" 을 반복해보거나, 첫 연과 마지막 연을 비슷하게 써보세요.' },
    { label: '여백의 미', text: '빈 행도 시의 일부예요. 숨을 쉬는 곳, 의미가 바뀌는 곳에 한 줄을 비워보세요. 독자도 함께 숨을 쉴 거예요.' },
    { label: '끝맺음', text: '마지막 행은 여운을 남겨보세요. 질문으로 끝내거나, 첫 행을 변형해서 다시 쓰거나, 짧고 강렬한 한 마디로요.' },
    { label: '제목 짓기', text: '제목도 시의 첫인상이에요. 핵심 단어 하나, 분위기를 담은 짧은 구절, 또는 의외의 단어를 제목으로 써보세요.' },
    { label: '감각 살리기', text: '시각, 청각, 촉각... 오감을 활용하면 시가 생생해져요. "따뜻한 바람"보다 "볼을 스치는 봄바람"이 더 와닿죠.' },
    { label: '시점 바꾸기', text: '"나"의 시점에서 벗어나 "너", "우리", 또는 사물의 시점으로 써보세요. 새로운 감정이 보일 거예요.' },
  ];

  const filledBSentences = sentences.filter(s => s.sentence.trim());

  useEffect(() => {
    if (stanzas.length === 1 && stanzas[0] === '' && partBText) {
      const lines = partBText.split('\n').filter(l => l.trim());
      if (lines.length <= 3) {
        setStanzas([partBText]);
      } else {
        const chunkSize = Math.ceil(lines.length / 3);
        const chunks: string[] = [];
        for (let i = 0; i < lines.length; i += chunkSize) {
          chunks.push(lines.slice(i, i + chunkSize).join('\n'));
        }
        setStanzas(chunks);
      }
    }
  }, []);

  useEffect(() => {
    const combined = stanzas.join('\n\n');
    if (combined !== partCText) setPartCText(combined);
  }, [stanzas]);

  const handleShowTip = () => {
    setCurrentTipIndex(prev => (prev + 1) % stanzaTips.length);
    setShowBase(false);
  };

  const tipData = showBase ? partCBase : stanzaTips[currentTipIndex];

  const countSyllables = (text: string) => text.replace(/\s/g, '').length;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-6 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setPhase('part-b')} className="text-sm text-ink-300">← B파트로</button>
          <span className="text-xs text-ink-400">C파트 — 연 나누기 & 운율</span>
          <TempSaveButton />
        </div>
        <div className="flex items-center justify-end mt-1">
          <button onClick={() => setPhase('finalize')} className="text-xs text-ink-300 hover:text-ink-500">완성 →</button>
        </div>
      </div>

      <div className="px-6 py-3">
        <div className="bg-cream-100 rounded-card p-4 bubble-in" key={currentTipIndex}>
          <span className="text-xs text-warm-500 font-medium mb-1 block">{tipData.label}</span>
          <p className="text-ink-600 text-[15px] leading-relaxed">{tipData.text}</p>
        </div>
        {showFreeMessage && (
          <div className="mt-3 bg-warm-100 rounded-xl p-3 text-sm text-ink-500 leading-relaxed bubble-in">{partCFreeMessage}</div>
        )}
        <div className="flex gap-2 mt-2">
          <button onClick={handleShowTip} className="flex-1 py-2 rounded-xl bg-sage-100 text-sage-500 text-sm font-medium hover:bg-sage-200 transition-colors">
            {showBase ? '팁 보기 💡' : '다른 팁 💡'}
          </button>
          <button onClick={() => setShowBSentences(!showBSentences)}
            className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${showBSentences ? 'bg-warm-400 text-white' : 'bg-warm-100 text-warm-500 hover:bg-warm-200'}`}>
            📝 B파트
          </button>
          <button onClick={() => setShowRhythmHelper(!showRhythmHelper)}
            className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${showRhythmHelper ? 'bg-ink-700 text-white' : 'bg-cream-50 text-ink-400 hover:bg-cream-100'}`}>
            🎵
          </button>
        </div>
      </div>

      {/* B파트 문장 보기 */}
      {showBSentences && filledBSentences.length > 0 && (
        <div className="px-6 py-2 bubble-in">
          <div className="bg-warm-50 rounded-xl p-3 border border-warm-200">
            <p className="text-xs text-warm-500 font-medium mb-2">📝 B파트에서 만든 문장들</p>
            <div className="space-y-1.5">
              {filledBSentences.map(s => (
                <div key={s.id} className="flex items-start gap-2">
                  <span className="text-warm-400 text-xs mt-0.5">•</span>
                  <p className="text-sm text-ink-500 leading-relaxed">{s.sentence}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showRhythmHelper && (
        <div className="px-6 py-2 bubble-in">
          <div className="bg-purple-50 rounded-xl p-3 text-xs text-ink-500">
            <p className="font-medium mb-1">🎵 운율 도우미</p>
            <p>각 행의 글자수를 보여드려요. 비슷하게 맞추면 리듬감이 살아나요!</p>
            <div className="mt-2 space-y-1">
              {stanzas.map((stanza, si) =>
                stanza.split('\n').filter(l => l.trim()).map((line, li) => (
                  <div key={`${si}-${li}`} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold">{countSyllables(line)}</span>
                    <span className="text-ink-400 truncate">{line}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 px-6 py-4 overflow-y-auto space-y-4">
        {stanzas.map((stanza, idx) => (
          <div key={idx} className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-ink-300 font-medium">제{idx + 1}연</span>
              <div className="flex-1 h-px bg-cream-200" />
              {stanzas.length > 1 && (
                <button onClick={() => setStanzas(stanzas.filter((_, i) => i !== idx))} className="text-xs text-red-300 hover:text-red-500">삭제</button>
              )}
            </div>
            <textarea
              value={stanza}
              onChange={(e) => {
                const updated = [...stanzas];
                updated[idx] = e.target.value;
                setStanzas(updated);
              }}
              placeholder={`제${idx + 1}연을 써주세요...`}
              className="w-full bg-cream-50 rounded-xl p-3 text-ink-600 placeholder:text-ink-200 leading-[2] poem-text resize-none focus:outline-none focus:ring-1 focus:ring-warm-300"
              rows={Math.max(3, stanza.split('\n').length + 1)}
            />
          </div>
        ))}
        <button onClick={() => setStanzas([...stanzas, ''])}
          className="w-full py-3 rounded-xl border-2 border-dashed border-cream-200 text-ink-300 text-sm hover:border-cream-300 hover:text-ink-400 transition-colors">
          + 연 추가하기
        </button>
      </div>

      <div className="px-6 pb-8 flex-shrink-0">
        <button onClick={() => setPhase('finalize')} className="w-full py-4 rounded-2xl bg-ink-700 text-white font-medium hover:bg-ink-600 transition-colors">
          시 완성하기 🌸
        </button>
      </div>
    </div>
  );
}

/* ======================== FINALIZE ======================== */
type PoemStyle = 'calm' | 'sensory' | 'reflective';

const STYLE_INFO: Record<PoemStyle, { emoji: string; label: string; description: string; color: string }> = {
  calm: {
    emoji: '🌙',
    label: '담담하게',
    description: '조용히 스며드는 서정적 분위기\n나지막한 목소리, 소박한 언어',
    color: 'from-blue-50 to-indigo-50',
  },
  sensory: {
    emoji: '🎨',
    label: '감각적으로',
    description: '오감이 살아있는 선명한 이미지\n색채와 질감이 느껴지는 시',
    color: 'from-pink-50 to-rose-50',
  },
  reflective: {
    emoji: '🔮',
    label: '사유하며',
    description: '깊은 생각과 철학적 여운\n역설과 깨달음이 담긴 시',
    color: 'from-purple-50 to-violet-50',
  },
};

function FinalizePhase({ onTryExit }: { onTryExit: (action: () => void) => void }) {
  const {
    partCText, poemTitle, setPoemTitle, finalPoem, setFinalPoem,
    poemBackground, setPoemBackground, selectedFlowerId, authorName,
    qaItems, sentences, addPoem, setPhase, user, watchAd, usePencil,
    setShowSharePopup, addActivityLog,
  } = useAppStore();
  const router = useRouter();
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [generateError, setGenerateError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [pencilRefunded, setPencilRefunded] = useState(false);
  const [showPencilConfirm, setShowPencilConfirm] = useState(false);
  const [pendingStyle, setPendingStyle] = useState<PoemStyle | null>(null);
  // Style & generation state
  const [selectedStyle, setSelectedStyle] = useState<PoemStyle | null>(null);
  const [generatedPoems, setGeneratedPoems] = useState<Record<PoemStyle, string>>({} as Record<PoemStyle, string>);
  const [viewingStyle, setViewingStyle] = useState<PoemStyle | null>(null);
  // AI sub-phase: 'pick' = choose style, 'result' = see generated poem & decide, 'edit' = editing for save
  const [aiStep, setAiStep] = useState<'pick' | 'result' | 'edit'>('pick');
  const poemRef = useRef<HTMLDivElement>(null);
  const flower = getFlowerById(selectedFlowerId || '');

  useEffect(() => {
    if (!finalPoem && partCText) setFinalPoem(partCText);
  }, []);

  const backgrounds = [
    'bg-white', 'bg-cream-50', 'bg-cream-100', 'bg-warm-100',
    'bg-purple-50', 'bg-pink-50', 'bg-blue-50', 'bg-green-50',
    'bg-yellow-50', 'bg-red-50', 'bg-slate-800', 'bg-ink-700',
  ];
  const bgLabels: Record<string, string> = {
    'bg-white': '하양', 'bg-cream-50': '크림', 'bg-cream-100': '베이지',
    'bg-warm-100': '따뜻한', 'bg-purple-50': '보라', 'bg-pink-50': '분홍',
    'bg-blue-50': '하늘', 'bg-green-50': '연두', 'bg-yellow-50': '노랑',
    'bg-red-50': '장미', 'bg-slate-800': '밤', 'bg-ink-700': '먹',
  };
  const isDark = poemBackground.includes('800') || poemBackground.includes('700');

  const hasPencils = user?.isAdmin || (user?.pencils || 0) > 0;
  const allStyles: PoemStyle[] = ['calm', 'sensory', 'reflective'];
  const generatedStyles = Object.keys(generatedPoems) as PoemStyle[];
  const remainingStyles = allStyles.filter(s => !generatedPoems[s]);

  const handleWatchAd = () => {
    setShowAdModal(true);
    setAdCountdown(5);
    const timer = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAdComplete = () => {
    watchAd();
    setShowAdModal(false);
  };

  const refundPencil = () => {
    if (!pencilRefunded && user && !user.isAdmin) {
      const { buyPencils } = useAppStore.getState();
      buyPencils(1);
      setPencilRefunded(true);
    }
  };

  // Pick a style → confirm pencil → consume → generate
  const handleStyleSelect = async (style: PoemStyle) => {
    // Already generated? Just show it
    if (generatedPoems[style]) {
      setSelectedStyle(style);
      setViewingStyle(style);
      setAiStep('result');
      return;
    }

    // Admin skips confirmation
    if (user?.isAdmin) {
      setSelectedStyle(style);
      setGenerateError('');
      await doGenerate(style);
      return;
    }

    // Show pencil confirmation modal
    setPendingStyle(style);
    setShowPencilConfirm(true);
  };

  // Confirmed: consume pencil and generate
  const handlePencilConfirmed = async () => {
    if (!pendingStyle) return;
    setShowPencilConfirm(false);
    const style = pendingStyle;
    setPendingStyle(null);

    setSelectedStyle(style);
    setGenerateError('');

    // Consume pencil
    const ok = usePencil();
    if (!ok) {
      setGenerateError('연필이 부족해요. 광고를 보거나 연필을 구매해주세요!');
      return;
    }

    await doGenerate(style);
  };

  const doGenerate = async (style: PoemStyle) => {
    setIsGenerating(true);
    setGenerateError('');
    setPencilRefunded(false);
    try {
      const response = await fetch('/api/generate-poem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qaItems: qaItems.map(qa => ({ questionLabel: qa.questionLabel, answer: qa.answer })),
          flowerMeaning: flower?.meaning || '',
          flowerName: flower?.name || '',
          authorName,
          userInfo: { email: user?.email, name: user?.name, id: user?.id },
          style,
        }),
      });
      const data = await response.json();

      if (data.poem && !data.errorCode) {
        const poem = data.poem;
        setGeneratedPoems(prev => ({ ...prev, [style]: poem }));
        setViewingStyle(style);
        setAiStep('result');
        addActivityLog('ai_usage', `AI 시 생성 (${STYLE_INFO[style].label})`, `꽃: ${flower?.name}\n\n${poem}`);
      } else {
        refundPencil();
        setShowErrorModal(true);
      }
    } catch (err) {
      refundPencil();
      setShowErrorModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // User picks this poem to edit/save
  const handleGoToEdit = (style: PoemStyle) => {
    const poem = generatedPoems[style];
    if (!poem) return;
    setSelectedStyle(style);
    setFinalPoem(poem);
    setAiStep('edit');
  };

  // User wants to try another style from result screen
  const handleTryAnother = () => {
    setAiStep('pick');
  };

  const handleSave = async () => {
    const localPoem: PoemDraft = {
      id: uuidv4(),
      flowerId: selectedFlowerId || '',
      authorName,
      authorId: user?.id || 'anonymous',
      qaItems,
      sentences,
      partBText: partCText,
      partCText: finalPoem,
      title: poemTitle || '무제',
      finalPoem,
      background: poemBackground,
      isCompleted: true,
      isAutoGenerated: mode === 'auto',
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      views: 0,
      reports: [],
      isHidden: false,
      comments: [],
    };

    // localStorage에도 저장 (오프라인 fallback)
    addPoem(localPoem);

    // DB에 저장
    let savedPoemId = localPoem.id;
    try {
      const res = await fetch('/api/poems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowerId: selectedFlowerId || '',
          authorName,
          authorId: user?.id || 'anonymous',
          qaItems,
          sentences,
          partBText: partCText,
          partCText: finalPoem,
          title: poemTitle || '무제',
          finalPoem,
          background: poemBackground,
          isCompleted: true,
          isAutoGenerated: mode === 'auto',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.poem?.id) {
          savedPoemId = data.poem.id;
        }
      }
    } catch (e) {
      console.error('Failed to save poem to DB:', e);
    }

    setShowSharePopup(true);
    router.replace(`/poem/${savedPoemId}`);
  };

  // Which poem text to display in result view
  const viewingPoem = viewingStyle ? generatedPoems[viewingStyle] : '';

  return (
    <div className="min-h-screen flex flex-col pb-8">
      <div className="px-6 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <button onClick={() => {
            if (mode === 'auto' && aiStep === 'edit') { setAiStep('result'); }
            else if (mode === 'auto' && aiStep === 'result') { setAiStep('pick'); }
            else setPhase('part-c');
          }} className="text-sm text-ink-300">
            {mode === 'auto' && aiStep === 'edit' ? '← 미리보기로' : mode === 'auto' && aiStep === 'result' ? '← 스타일 선택' : '← 다듬기로'}
          </button>
          <span className="text-xs text-ink-400">완성하기</span>
          <TempSaveButton />
        </div>
      </div>

      <div className="px-6 py-3 flex gap-2">
        <button onClick={() => { setMode('manual'); setAiStep('pick'); }} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'manual' ? 'bg-ink-700 text-white' : 'bg-cream-50 text-ink-400'}`}>✏️ 직접 완성</button>
        <button onClick={() => { setMode('auto'); if (aiStep === 'edit') setAiStep('pick'); }} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'auto' ? 'bg-ink-700 text-white' : 'bg-cream-50 text-ink-400'}`}>✨ AI 쓰기</button>
      </div>

      {/* ===================== AUTO MODE ===================== */}
      {mode === 'auto' && (
        <>
          {/* --- STEP: Pick a style --- */}
          {aiStep === 'pick' && !isGenerating && (
            <div className="px-6 py-2 space-y-4">
              {/* Pencil info bar */}
              <div className="flex items-center justify-between bg-amber-50 rounded-xl py-2.5 px-4">
                <div className="flex items-center gap-2">
                  <span>✏️</span>
                  <span className="text-xs text-amber-700 font-medium">스타일 1개 = 연필 1자루</span>
                </div>
                <span className="text-sm font-bold text-amber-600">{user?.isAdmin ? '∞' : (user?.pencils || 0)}자루</span>
              </div>

              {generateError && <p className="text-red-400 text-xs text-center">{generateError}</p>}

              {/* No pencils? */}
              {!user?.isAdmin && !hasPencils && (
                <button onClick={handleWatchAd}
                  className="w-full py-3 rounded-xl bg-warm-400 text-white font-medium text-sm">
                  📺 광고 보고 연필 얻기 (+1)
                </button>
              )}

              {/* Style cards */}
              <div className="space-y-3">
                {allStyles.map(style => {
                  const info = STYLE_INFO[style];
                  const done = !!generatedPoems[style];
                  return (
                    <button
                      key={style}
                      onClick={() => handleStyleSelect(style)}
                      className={`w-full text-left rounded-xl p-4 transition-all border-2 hover:shadow-md bg-gradient-to-r ${info.color} ${
                        done ? 'border-sage-300' : 'border-transparent hover:border-warm-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{info.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-ink-700">{info.label}</p>
                            {done && <span className="text-[10px] bg-sage-100 text-sage-600 px-1.5 py-0.5 rounded-full">✓ 생성됨</span>}
                          </div>
                          <p className="text-xs text-ink-400 mt-1 whitespace-pre-line leading-relaxed">{info.description}</p>
                          {done && (
                            <p className="text-[11px] text-sage-500 mt-1.5 line-clamp-1">"{generatedPoems[style].split('\n')[0]}"</p>
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-1 mt-1">
                          {done
                            ? <span className="text-xs text-sage-500">보기</span>
                            : <span className="text-xs text-ink-400">✏️ 1자루</span>
                          }
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Already generated count info */}
              {generatedStyles.length > 0 && (
                <div className="bg-cream-50 rounded-xl p-3 flex items-start gap-2">
                  <span className="text-sm mt-0.5">📋</span>
                  <p className="text-xs text-ink-400 leading-relaxed">
                    {generatedStyles.length}개 생성 완료! 생성된 시는 <span className="font-medium text-ink-600">프로필 → 활동로그</span>에서도 확인 가능해요.
                    {remainingStyles.length > 0
                      ? ` 나머지 ${remainingStyles.length}개도 해보세요!`
                      : ' 3개 모두 완성했어요! 🎉'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* --- Loading --- */}
          {isGenerating && (
            <div className="px-6 py-8 flex flex-col items-center">
              <div className="text-5xl mb-4 gentle-float">{selectedStyle ? STYLE_INFO[selectedStyle].emoji : '🌸'}</div>
              <p className="text-ink-500 font-medium">
                {selectedStyle ? `"${STYLE_INFO[selectedStyle].label}" 스타일로 시를 쓰고 있어요...` : '시를 쓰고 있어요...'}
              </p>
              <p className="text-ink-300 text-sm mt-1">잠시만 기다려주세요</p>
              <div className="flex gap-2 mt-4">
                <div className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}

          {/* --- STEP: Result — preview generated poem & decide --- */}
          {aiStep === 'result' && !isGenerating && viewingStyle && (
            <div className="px-6 py-2 space-y-4">
              {/* Toggle tabs for generated poems */}
              {generatedStyles.length > 1 && (
                <div className="flex gap-1.5">
                  {generatedStyles.map(style => {
                    const info = STYLE_INFO[style];
                    const isActive = viewingStyle === style;
                    return (
                      <button key={style} onClick={() => setViewingStyle(style)}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                          isActive ? `bg-gradient-to-r ${info.color} border-2 border-ink-300 shadow-sm` : 'bg-cream-50 text-ink-400 border-2 border-transparent'
                        }`}>
                        <span>{info.emoji}</span>
                        <span>{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Current style badge */}
              <div className="flex items-center justify-between">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${STYLE_INFO[viewingStyle].color} border border-cream-200`}>
                  <span>{STYLE_INFO[viewingStyle].emoji}</span>
                  <span className="text-xs font-medium text-ink-500">{STYLE_INFO[viewingStyle].label}</span>
                </div>
              </div>

              {/* Poem preview (read-only) */}
              <div className="bg-cream-50 rounded-card p-6 min-h-[200px]">
                <p className="text-ink-600 poem-text leading-[2] whitespace-pre-line">{viewingPoem}</p>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button onClick={() => handleGoToEdit(viewingStyle)}
                  className="w-full py-3.5 rounded-2xl bg-ink-700 text-white font-medium hover:bg-ink-600 transition-colors">
                  ✏️ 이 시를 수정하고 저장하기
                </button>

                {remainingStyles.length > 0 && (
                  <button onClick={handleTryAnother}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-warm-100 to-pink-100 text-ink-600 font-medium border border-warm-200 hover:shadow-sm transition-all">
                    ✨ 다른 스타일도 해보기 ({remainingStyles.length}개 남음 · ✏️ 1자루)
                  </button>
                )}

                {generatedStyles.length >= 2 && (
                  <p className="text-xs text-ink-300 text-center pt-1">
                    위 탭을 눌러 생성된 시를 비교해보세요!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* --- STEP: Edit — user chose a poem to edit & save --- */}
          {aiStep === 'edit' && !isGenerating && selectedStyle && (
            <>
              {/* Style badge */}
              <div className="px-6 py-2">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${STYLE_INFO[selectedStyle].color} border border-cream-200`}>
                  <span>{STYLE_INFO[selectedStyle].emoji}</span>
                  <span className="text-xs font-medium text-ink-500">{STYLE_INFO[selectedStyle].label}</span>
                </div>
              </div>

              <div className="px-6 py-3">
                <input value={poemTitle} onChange={(e) => setPoemTitle(e.target.value)} placeholder="시의 제목을 지어주세요"
                  className="w-full text-xl font-bold text-ink-700 placeholder:text-ink-200 bg-transparent focus:outline-none" />
              </div>

              <div className="px-6 py-3 flex-1">
                <div ref={poemRef} className={`${poemBackground} rounded-card p-8 min-h-[300px] relative transition-colors`}>
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button onClick={() => setShowBgPicker(!showBgPicker)} className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-sm">🎨</button>
                  </div>
                  {showBgPicker && (
                    <div className="absolute top-12 right-3 bg-white rounded-xl shadow-lg p-3 grid grid-cols-4 gap-2 z-10">
                      {backgrounds.map(bg => (
                        <button key={bg} onClick={() => { setPoemBackground(bg); setShowBgPicker(false); }}
                          className={`w-8 h-8 rounded-full ${bg} border-2 ${poemBackground === bg ? 'border-ink-600' : 'border-transparent'}`} title={bgLabels[bg]} />
                      ))}
                    </div>
                  )}
                  <textarea value={finalPoem} onChange={(e) => setFinalPoem(e.target.value)} placeholder="시를 완성해주세요..."
                    className={`writing-area w-full h-full bg-transparent poem-text ${isDark ? 'text-white placeholder:text-white/40' : 'text-ink-600 placeholder:text-ink-200'}`}
                    style={{ minHeight: '250px' }} />
                </div>
                <p className="text-xs text-ink-300 mt-2 text-center">AI가 쓴 시를 자유롭게 수정하세요 ✏️</p>
              </div>

              <div className="px-6 py-3 flex items-center gap-2 text-sm text-ink-400">
                <span>{flower?.emoji}</span><span>{flower?.name}</span><span className="mx-1">·</span><span>{authorName}</span>
              </div>

              <div className="px-6 space-y-3">
                <button onClick={handleSave} disabled={!finalPoem.trim()}
                  className="w-full py-4 rounded-2xl bg-ink-700 text-white font-medium hover:bg-ink-600 transition-colors disabled:opacity-50">
                  시 저장하기 🌸
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* ===================== MANUAL MODE ===================== */}
      {mode === 'manual' && (
        <>
          <div className="px-6 py-3">
            <input value={poemTitle} onChange={(e) => setPoemTitle(e.target.value)} placeholder="시의 제목을 지어주세요"
              className="w-full text-xl font-bold text-ink-700 placeholder:text-ink-200 bg-transparent focus:outline-none" />
          </div>

          <div className="px-6 py-3 flex-1">
            <div ref={poemRef} className={`${poemBackground} rounded-card p-8 min-h-[300px] relative transition-colors`}>
              <div className="absolute top-3 right-3 flex gap-1">
                <button onClick={() => setShowBgPicker(!showBgPicker)} className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-sm">🎨</button>
              </div>
              {showBgPicker && (
                <div className="absolute top-12 right-3 bg-white rounded-xl shadow-lg p-3 grid grid-cols-4 gap-2 z-10">
                  {backgrounds.map(bg => (
                    <button key={bg} onClick={() => { setPoemBackground(bg); setShowBgPicker(false); }}
                      className={`w-8 h-8 rounded-full ${bg} border-2 ${poemBackground === bg ? 'border-ink-600' : 'border-transparent'}`} title={bgLabels[bg]} />
                  ))}
                </div>
              )}
              <textarea value={finalPoem} onChange={(e) => setFinalPoem(e.target.value)} placeholder="시를 완성해주세요..."
                className={`writing-area w-full h-full bg-transparent poem-text ${isDark ? 'text-white placeholder:text-white/40' : 'text-ink-600 placeholder:text-ink-200'}`}
                style={{ minHeight: '250px' }} />
            </div>
          </div>

          <div className="px-6 py-3 flex items-center gap-2 text-sm text-ink-400">
            <span>{flower?.emoji}</span><span>{flower?.name}</span><span className="mx-1">·</span><span>{authorName}</span>
          </div>

          <div className="px-6 space-y-3">
            <button onClick={handleSave} disabled={!finalPoem.trim()}
              className="w-full py-4 rounded-2xl bg-ink-700 text-white font-medium hover:bg-ink-600 transition-colors disabled:opacity-50">
              시 저장하기 🌸
            </button>
          </div>
        </>
      )}

      {/* ===== Pencil Confirm Modal ===== */}
      {showPencilConfirm && pendingStyle && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center" onClick={() => { setShowPencilConfirm(false); setPendingStyle(null); }}>
          <div className="bg-white rounded-card w-[90%] max-w-[380px] p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">✏️</div>
              <h3 className="font-bold text-ink-700 text-lg">연필을 사용할까요?</h3>
              <p className="text-sm text-ink-400 mt-2 leading-relaxed">
                AI 시 생성에 <strong className="text-amber-600">연필 1자루</strong>가 소모됩니다.
              </p>
              <div className="mt-3 bg-amber-50 rounded-xl py-2.5 px-4 inline-block">
                <span className="text-sm text-amber-700">현재 보유: <strong>{user?.pencils || 0}자루</strong> → <strong>{Math.max(0, (user?.pencils || 0) - 1)}자루</strong></span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowPencilConfirm(false); setPendingStyle(null); }}
                className="flex-1 py-3 rounded-xl bg-cream-100 text-ink-500 font-medium text-sm">
                취소
              </button>
              <button onClick={handlePencilConfirmed}
                className="flex-1 py-3 rounded-xl bg-ink-700 text-white font-medium text-sm">
                사용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Error Modal ===== */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center" onClick={() => setShowErrorModal(false)}>
          <div className="bg-white rounded-card w-[90%] max-w-[380px] p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🌧️</div>
              <h3 className="font-bold text-ink-700 text-lg">잠시 문제가 생겼어요</h3>
              <p className="text-sm text-ink-400 mt-2 leading-relaxed">
                자동 완성 기능에 일시적인 문제가 있어요.<br/>
                잠시 후 다시 시도해주세요.
              </p>
            </div>

            {pencilRefunded && (
              <div className="bg-sage-50 rounded-xl p-3 mb-4 flex items-center gap-2">
                <span>✏️</span>
                <p className="text-xs text-sage-600">연필은 차감되지 않았어요.</p>
              </div>
            )}

            <div className="space-y-2 mb-4">
              <button
                onClick={() => { setShowErrorModal(false); if (selectedStyle) doGenerate(selectedStyle); }}
                className="w-full py-3 rounded-xl bg-ink-700 text-white font-medium">
                다시 시도하기
              </button>
              <button
                onClick={() => { setShowErrorModal(false); setMode('manual'); }}
                className="w-full py-3 rounded-xl bg-cream-100 text-ink-600 font-medium">
                직접 쓰기로 전환
              </button>
            </div>

            <div className="pt-3 border-t border-cream-200 text-center">
              <p className="text-xs text-ink-300 mb-1.5">문제가 계속되나요?</p>
              <a href="mailto:support@sigeuldam.kr?subject=자동완성 문의"
                className="text-xs text-ink-400 underline">
                support@sigeuldam.kr
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Ad Modal */}
      {showAdModal && (
        <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center">
          <div className="bg-white rounded-card w-[90%] max-w-[360px] p-6 text-center">
            <p className="text-lg font-bold text-ink-700 mb-4">📺 광고</p>
            <div className="bg-cream-100 rounded-xl p-8 mb-4 relative overflow-hidden">
              <div id="sigeuldam-rewarded-ad" className="min-h-[200px] flex flex-col items-center justify-center">
                <div className="text-4xl mb-2">🌸</div>
                <p className="text-ink-400 text-sm">시글담 — 나만의 시를 담다</p>
                <p className="text-ink-300 text-xs mt-2">당신의 마음을 시로 표현해보세요</p>
              </div>
            </div>
            {adCountdown > 0 ? (
              <p className="text-ink-400 text-sm">{adCountdown}초 후에 닫을 수 있어요...</p>
            ) : (
              <button onClick={handleAdComplete} className="w-full py-3 rounded-xl bg-ink-700 text-white font-medium">
                광고 끝! 연필 받기 ✏️
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function generateFallbackPoem(qaItems: any[], theme: string): string {
  const answers = qaItems.map(q => q.answer).filter(Boolean);
  const words = answers.join(' ').split(/[,.\s]+/).filter((w: string) => w.length > 1);
  const uniqueWords = Array.from(new Set(words));
  const lines = [];
  const chunkSize = Math.ceil(uniqueWords.length / 4);
  for (let i = 0; i < 4; i++) {
    const chunk = uniqueWords.slice(i * chunkSize, (i + 1) * chunkSize);
    if (chunk.length > 0) lines.push(chunk.slice(0, 3).join(' '));
    if (i < 3 && chunk.length > 0) lines.push('');
  }
  return lines.join('\n') || `${theme}에 대하여\n\n아직 다 쓰지 못한\n마음이 있다면\n\n천천히 적어보세요\n그것이 시가 됩니다`;
}
