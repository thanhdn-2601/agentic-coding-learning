'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { createClient } from '@/libs/supabase/client';
import { useTranslations } from 'next-intl';
import type { MentionSuggestion } from './KudoRichEditor';

const KudoRichEditor = dynamic(() => import('./KudoRichEditor'), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-lg border min-h-41.25 animate-pulse"
      style={{ borderColor: '#C8B87A', backgroundColor: '#f9f9f9' }}
    />
  ),
});

interface Profile { id: string; full_name: string; avatar_url: string | null; }
interface Hashtag { id: string; name: string; }
interface SendKudosDialogProps { isOpen: boolean; onClose: () => void; onSuccess: () => void; }
type FormErrors = Partial<Record<'receiver' | 'title' | 'message' | 'hashtags' | 'submit', string>>;

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="flex items-center gap-0.5 shrink-0 text-[22px] font-bold leading-7 text-(--color-text-dark)">
      {children}
      {required && (
        <span className="text-base font-bold leading-5 text-(--color-required)">*</span>
      )}
    </label>
  );
}

export default function SendKudosDialog({ isOpen, onClose, onSuccess }: SendKudosDialogProps) {
  const t = useTranslations('kudos.sendDialog');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [receiverId, setReceiverId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [danhHieu, setDanhHieu] = useState('');
  const [messageHtml, setMessageHtml] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [hashtagDropdownOpen, setHashtagDropdownOpen] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousName, setAnonymousName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editorKey, setEditorKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const hashtagRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedProfile =
    profiles.find((p) => p.id === receiverId) ??
    searchResults.find((p) => p.id === receiverId);
  const isMessageEmpty = !messageHtml || messageHtml === '<p></p>' || messageHtml === '<p><br></p>';
  const canSubmit = receiverId && danhHieu.trim() && !isMessageEmpty && selectedHashtags.length > 0;
  const availableHashtags = hashtags.filter((h) => !selectedHashtags.includes(h.name));

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      fetch('/api/profiles/search').then((r) => r.json()).catch(() => ({ profiles: [] })),
      fetch('/api/hashtags').then((r) => r.json()).catch(() => ({ hashtags: [] })),
    ]).then(([pData, hData]) => {
      const ps = (pData as { profiles: Profile[] }).profiles ?? [];
      setProfiles(ps);
      setSearchResults(ps);
      setMentionSuggestions(ps.map((p) => ({ id: p.id, label: p.full_name })));
      setHashtags((hData as { hashtags: Hashtag[] }).hashtags ?? []);
    });
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    };
    if (showSearch) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSearch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (hashtagRef.current && !hashtagRef.current.contains(e.target as Node))
        setHashtagDropdownOpen(false);
    };
    if (hashtagDropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [hashtagDropdownOpen]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowSearch(true);
    setErrors((p) => ({ ...p, receiver: undefined }));
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetch(`/api/profiles/search?q=${encodeURIComponent(value.trim())}`)
        .then((r) => r.json() as Promise<{ profiles?: Profile[] }>)
        .then((data) => setSearchResults(data.profiles ?? []))
        .catch(() => {});
    }, 300);
  }, []);

  const resetForm = useCallback(() => {
    setReceiverId(''); setSearchQuery(''); setShowSearch(false); setDanhHieu('');
    setMessageHtml(''); setCharCount(0); setSelectedHashtags([]); setHashtagDropdownOpen(false);
    setImages([]); setIsAnonymous(false); setAnonymousName(''); setErrors({});
    setEditorKey((k) => k + 1);
  }, []);

  const addHashtag = (name: string) => {
    setSelectedHashtags((prev) => [...prev, name].slice(0, 5));
    setHashtagDropdownOpen(false);
    setErrors((p) => ({ ...p, hashtags: undefined }));
  };

  const removeHashtag = (tag: string) =>
    setSelectedHashtags((prev) => prev.filter((h) => h !== tag));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files.slice(0, 5 - prev.length)]);
    e.target.value = '';
  };

  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index));

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!receiverId) e.receiver = t('validation.receiver');
    if (!danhHieu.trim()) e.title = t('validation.title');
    if (isMessageEmpty) e.message = t('validation.message');
    if (selectedHashtags.length === 0) e.hashtags = t('validation.hashtags');
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setSubmitting(true); setErrors({});
    try {
      const uploadedUrls: string[] = [];
      if (images.length > 0) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id ?? 'anonymous';
        for (const file of images) {
          const filePath = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const { data, error: uploadError } = await supabase.storage
            .from('kudo-images').upload(filePath, file, { upsert: false });
          if (uploadError) {
            for (const url of uploadedUrls) {
              const parts = url.split('/kudo-images/');
              if (parts[1]) await supabase.storage.from('kudo-images').remove([decodeURIComponent(parts[1])]);
            }
            throw new Error(`Upload ảnh thất bại: ${uploadError.message}`);
          }
          const { data: urlData } = supabase.storage.from('kudo-images').getPublicUrl(data.path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }
      const res = await fetch('/api/kudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: receiverId, message: messageHtml, danh_hieu: danhHieu.trim(),
          hashtags: selectedHashtags, is_anonymous: isAnonymous,
          anonymous_name: isAnonymous ? anonymousName.trim() || null : null,
          image_urls: uploadedUrls,
        }),
      });
      if (!res.ok) { const d = (await res.json()) as { error: string }; throw new Error(d.error); }
      onSuccess(); onClose(); resetForm();
    } catch (err) {
      setErrors({ submit: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-[752px] max-h-[calc(100vh-80px)] overflow-y-auto rounded-3xl bg-(--color-card-bg) p-10 flex flex-col gap-8 animate-fade-in my-auto"
      >
        {/* ── Title ── */}
        <h2 className="w-full text-[32px] font-bold leading-10 text-center text-(--color-text-dark)">
          {t('title')}
        </h2>

        {/* ── Người nhận ── */}
        <div className="flex flex-row items-center gap-4 w-full">
          <FieldLabel required>{t('receiverLabel')}</FieldLabel>
          <div className="relative flex-1" ref={searchRef}>
            {selectedProfile ? (
              <div
                className="flex items-center justify-between h-14 px-6 py-4 rounded-lg border bg-white transition-colors duration-150 border-(--color-border)"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Image
                    src={selectedProfile.avatar_url ?? '/assets/profile/anonymous.png'}
                    alt="" width={24} height={24}
                    className="rounded-full object-cover shrink-0"
                  />
                  <span className="flex-1 truncate text-base font-bold leading-6 tracking-[0.15px] text-(--color-text-dark)">
                    {selectedProfile.full_name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setReceiverId(''); setSearchQuery(''); setSearchResults(profiles); }}
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[rgba(0,0,0,0.08)] text-(--color-text-gray)"
                  aria-label={t('removeRecipient')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>
            ) : (
              <div
                className={`flex items-center justify-between h-14 px-6 py-4 rounded-lg border bg-white transition-colors duration-150 focus-within:border-(--color-gold-primary) ${errors.receiver ? 'border-red-500' : 'border-(--color-border)'}`}
              >
                <input
                  placeholder={t('searchPlaceholder')}
                  aria-required="true"
                  aria-label={t('receiverLabel')}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  className="flex-1 text-base font-bold leading-6 tracking-[0.15px] text-(--color-text-dark) placeholder:text-(--color-text-gray) bg-transparent outline-none"
                />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-(--color-text-dark) shrink-0" aria-hidden="true">
                  <path d="M7 10L12 15L17 10H7Z" fill="currentColor" />
                </svg>
              </div>
            )}
            {showSearch && !selectedProfile && (
              <ul
                className="absolute z-20 w-full mt-1 rounded-lg border overflow-y-auto shadow-lg bg-(--color-card-bg) border-(--color-border)"
                style={{ maxHeight: '192px' }}
              >
                {searchResults.length === 0 ? (
                  <li className="px-4 py-3 text-sm font-bold text-(--color-text-gray)">{t('noResults')}</li>
                ) : (
                  searchResults.slice(0, 10).map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiverId(p.id);
                          setShowSearch(false);
                          setSearchQuery('');
                          setErrors((prev) => ({ ...prev, receiver: undefined }));
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold hover:bg-[rgba(196,184,122,0.15)] text-(--color-text-dark)"
                      >
                        <Image
                          src={p.avatar_url ?? '/assets/profile/anonymous.png'}
                          alt="" width={24} height={24}
                          className="rounded-full object-cover shrink-0"
                        />
                        {p.full_name}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
            {errors.receiver && <p className="mt-1 text-xs text-red-500">{errors.receiver}</p>}
          </div>
        </div>

        {/* ── Danh hiệu ── */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row items-center gap-4">
            <FieldLabel required>{t('titleLabel')}</FieldLabel>
            <input
              placeholder={t('titlePlaceholder')}
              maxLength={100}
              aria-required="true"
              aria-label={t('titleLabel')}
              type="text"
              value={danhHieu}
              onChange={(e) => { setDanhHieu(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
              className={`w-[514px] h-14 px-6 py-4 rounded-lg border bg-white text-base font-bold leading-6 tracking-[0.15px] text-(--color-text-dark) placeholder:text-(--color-text-gray) outline-none transition-colors duration-150 focus:border-(--color-gold-primary) ${errors.title ? 'border-red-500' : 'border-(--color-border)'}`}
            />
          </div>
          <p className="text-base font-bold leading-6 text-(--color-text-gray) ml-[155px]">
            {t('titleHint')}
          </p>
          {errors.title && <p className="ml-[155px] text-xs text-red-500">{errors.title}</p>}
        </div>

        {/* ── Editor ── */}
        <div className="flex flex-col gap-1 w-full">
          <KudoRichEditor
            key={editorKey}
            onChange={(html) => { setMessageHtml(html); setErrors((p) => ({ ...p, message: undefined })); }}
            onCharCountChange={setCharCount}
            mentionSuggestions={mentionSuggestions}
            maxLength={3000}
            error={errors.message}
          />
          <div className="flex justify-between items-center">
            <p className="text-base font-bold leading-6 tracking-[0.5px] text-(--color-text-dark)">
              {t('mentionHint')}
            </p>
            <span className="text-sm text-(--color-text-gray)">{charCount}/3000</span>
          </div>
        </div>

        {/* ── Hashtag ── */}
        <div className="flex flex-row items-center gap-4 w-full">
          <FieldLabel required>{t('hashtagLabel')}</FieldLabel>
          <div className="relative flex flex-row flex-wrap items-center gap-2">
            {selectedHashtags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: '#FFEA9E', color: '#3D2E0E', border: '1px solid #C8B87A' }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeHashtag(tag)}
                  className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-[rgba(0,0,0,0.15)]"
                  aria-label={t('removeHashtag', { tag })}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            ))}
            {selectedHashtags.length < 5 && (
              <div ref={hashtagRef} className="relative">
                <button
                  type="button"
                  onClick={() => setHashtagDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 h-12 px-2 py-1 rounded-lg border border-(--color-border) bg-white hover:bg-(--color-card-bg) transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-(--color-text-gray)" aria-hidden="true">
                    <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor" />
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-[11px] font-bold leading-4 tracking-[0.5px] text-(--color-text-gray)">{t('hashtagLabel')}</span>
                    <span className="text-[11px] font-bold leading-4 tracking-[0.5px] text-(--color-text-gray)">{t('hashtagMax')}</span>
                  </div>
                </button>
                {hashtagDropdownOpen && (
                  <ul
                    className="absolute z-20 mt-1 rounded-lg border overflow-y-auto shadow-lg bg-(--color-card-bg) border-(--color-border)"
                    style={{ minWidth: '160px', maxHeight: '200px', top: '100%', left: 0 }}
                  >
                    {availableHashtags.length === 0 ? (
                      <li className="px-3 py-2 text-sm font-bold text-(--color-text-gray)">{t('hashtagMaxSelected')}</li>
                    ) : (
                      availableHashtags.map((h) => (
                        <li key={h.id}>
                          <button
                            type="button"
                            onClick={() => addHashtag(h.name)}
                            className="w-full text-left px-3 py-2 text-sm font-bold hover:bg-[rgba(196,184,122,0.15)] text-(--color-text-dark)"
                          >
                            {h.name}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            )}
            {errors.hashtags && <p className="w-full text-xs text-red-500 mt-1">{errors.hashtags}</p>}
          </div>
        </div>

        {/* ── Ảnh ── */}
        <div className="flex flex-row items-center gap-4 w-full">
          <FieldLabel>{t('imageLabel')}</FieldLabel>
          <div className="flex flex-row flex-wrap items-center gap-4">
            {images.map((file, i) => (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-(--color-border) shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(file)} alt={t('removeImage', { n: i + 1 })} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center hover:bg-red-600"
                  aria-label={t('removeImage', { n: i + 1 })}
                >✕</button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 h-12 px-2 py-1 rounded-lg border border-(--color-border) bg-white hover:bg-(--color-card-bg) transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-(--color-text-gray)" aria-hidden="true">
                  <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor" />
                </svg>
                <div className="flex flex-col items-start">
                    <span className="text-[11px] font-bold leading-4 tracking-[0.5px] text-(--color-text-gray)">{t('imageLabel')}</span>
                    <span className="text-[11px] font-bold leading-4 tracking-[0.5px] text-(--color-text-gray)">{t('imageMax')}</span>
                </div>
              </button>
            )}
            <input
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              className="hidden"
              tabIndex={-1}
              type="file"
              onChange={handleImageSelect}
            />
          </div>
        </div>

        {/* ── Anonymous ── */}
        <div className="flex flex-col w-full">
          <label className="flex flex-row items-center gap-4 cursor-pointer">
            <div
              className={`w-6 h-6 rounded border flex items-center justify-center transition-colors duration-100 ${
                isAnonymous ? 'bg-(--color-gold-primary) border-(--color-border)' : 'bg-white border-[#999]'
              }`}
            >
              {isAnonymous && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 12l6 6L20 6" stroke="#3D2E0E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </div>
            <input
              className="sr-only"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => { setIsAnonymous(e.target.checked); if (!e.target.checked) setAnonymousName(''); }}
            />
            <span className={`text-[22px] font-bold leading-7 ${isAnonymous ? 'text-(--color-text-dark)' : 'text-(--color-text-gray)'}`}>
              {t('anonymousLabel')}
            </span>
          </label>
          <div
            className="overflow-hidden transition-all duration-200 ease-out"
            style={{ maxHeight: isAnonymous ? '88px' : '0px', opacity: isAnonymous ? 1 : 0 }}
          >
            <input
              placeholder={t('anonymousNamePlaceholder')}
              maxLength={50}
              aria-label={t('anonymousLabel')}
              type="text"
              value={anonymousName}
              onChange={(e) => setAnonymousName(e.target.value)}
              tabIndex={isAnonymous ? 0 : -1}
              className="w-full h-14 mt-4 px-6 py-4 rounded-lg border border-(--color-border) bg-white text-base font-bold leading-6 tracking-[0.15px] text-(--color-text-dark) placeholder:text-(--color-text-gray) outline-none transition-colors duration-150 focus:border-(--color-gold-primary)"
            />
          </div>
        </div>

        {errors.submit && (
          <p className="text-sm text-red-500 text-center">{errors.submit}</p>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-row gap-6 w-full">
          <button
            type="button"
            onClick={() => { onClose(); resetForm(); }}
            disabled={submitting}
            className="flex items-center gap-2 px-10 py-4 rounded border border-(--color-border) bg-[rgba(255,234,158,0.1)] text-base font-bold text-(--color-text-dark) transition-colors duration-150 hover:bg-[rgba(255,234,158,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M13.4759 12.0972L19.0159 17.6372V19.0972H17.5559L12.0159 13.5572L6.47587 19.0972H5.01587V17.6372L10.5559 12.0972L5.01587 6.55717V5.09717H6.47587L12.0159 10.6372L17.5559 5.09717H19.0159V6.55717L13.4759 12.0972Z" fill="currentColor" />
            </svg>
            <span>{t('cancel')}</span>
          </button>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="flex-1 flex items-center justify-center gap-1 h-[60px] rounded-lg bg-(--color-gold-primary) text-[22px] font-bold text-(--color-text-dark) transition-colors duration-150 hover:bg-[#FFE082] disabled:bg-[#E0D6B8] disabled:text-(--color-text-gray) disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="animate-spin mr-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3a9 9 0 019 9" strokeLinecap="round" />
                </svg>
                {t('submitting')}
              </>
            ) : (
              <>
                <span>{t('submit')}</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M2.9043 20.4797V4.47974L21.9043 12.4797M4.9043 17.4797L16.7543 12.4797L4.9043 7.47974V10.9797L10.9043 12.4797L4.9043 13.9797V17.4797Z" fill="currentColor" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
