'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';

export interface MentionSuggestion {
  id: string;
  label: string;
}

interface KudoRichEditorProps {
  value?: string;
  onChange: (html: string) => void;
  onCharCountChange?: (count: number) => void;
  placeholder?: string;
  mentionSuggestions?: MentionSuggestion[];
  maxLength?: number;
  error?: string;
}

interface MentionMenuState {
  open: boolean;
  items: MentionSuggestion[];
  selectedIndex: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  command: ((attrs: any) => void) | null;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
  className,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      aria-label={title}
      aria-pressed={active}
      className={`h-10 px-4 py-2.5 border border-(--color-border) transition-colors duration-100 hover:bg-[rgba(0,0,0,0.05)] ${
        active ? 'bg-[rgba(255,234,158,0.4)]' : 'bg-transparent'
      } ${className ?? ''}`}
    >
      {children}
    </button>
  );
}

export default function KudoRichEditor({
  value = '',
  onChange,
  onCharCountChange,
  placeholder = 'Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!',
  mentionSuggestions = [],
  maxLength = 3000,
  error,
}: KudoRichEditorProps) {
  const [mentionMenu, setMentionMenu] = useState<MentionMenuState>({
    open: false,
    items: [],
    selectedIndex: 0,
    command: null,
  });
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);
  const mentionSuggestionsRef = useRef(mentionSuggestions);

  useEffect(() => {
    mentionSuggestionsRef.current = mentionSuggestions;
  }, [mentionSuggestions]);

  // Keep a stable ref to setMentionMenu for use inside TipTap suggestion callbacks
  const setMentionMenuRef = useRef(setMentionMenu);
  setMentionMenuRef.current = setMentionMenu;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' },
      }),
      Mention.configure({
        HTMLAttributes: { class: 'text-amber-700 font-medium bg-amber-50 rounded px-0.5' },
        renderLabel: ({ node }) => `@${node.attrs.label ?? node.attrs.id}`,
        suggestion: {
          items: ({ query }: { query: string }) =>
            mentionSuggestionsRef.current
              .filter((s) => s.label.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 8),
          render: () => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onStart: (props: any) => {
              setMentionMenuRef.current({
                open: true,
                items: props.items as MentionSuggestion[],
                selectedIndex: 0,
                command: props.command,
              });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onUpdate: (props: any) => {
              setMentionMenuRef.current((prev) => ({
                ...prev,
                items: props.items as MentionSuggestion[],
                selectedIndex: 0,
                command: props.command,
              }));
            },
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
              if (event.key === 'Escape') {
                setMentionMenuRef.current({ open: false, items: [], selectedIndex: 0, command: null });
                return true;
              }
              if (event.key === 'ArrowDown') {
                setMentionMenuRef.current((prev) => ({
                  ...prev,
                  selectedIndex: (prev.selectedIndex + 1) % Math.max(1, prev.items.length),
                }));
                return true;
              }
              if (event.key === 'ArrowUp') {
                setMentionMenuRef.current((prev) => ({
                  ...prev,
                  selectedIndex:
                    (prev.selectedIndex - 1 + Math.max(1, prev.items.length)) %
                    Math.max(1, prev.items.length),
                }));
                return true;
              }
              if (event.key === 'Enter') {
                setMentionMenuRef.current((prev) => {
                  const item = prev.items[prev.selectedIndex];
                  if (item && prev.command) {
                    prev.command({ id: item.id, label: item.label });
                  }
                  return { open: false, items: [], selectedIndex: 0, command: null };
                });
                return true;
              }
              return false;
            },
            onExit: () => {
              setMentionMenuRef.current({ open: false, items: [], selectedIndex: 0, command: null });
            },
          }),
        },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
      if (onCharCountChange) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const count = (e.storage as any)?.characterCount?.characters?.() ?? 0;
        onCharCountChange(count);
      }
    },
    editorProps: {
      attributes: {
        class: 'w-full h-[200px] min-h-[120px] px-6 py-4 bg-white outline-none overflow-y-auto prose prose-sm max-w-none text-base font-bold leading-6',
      },
    },
  });

  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor?.isActive(name, attrs) ?? false;

  const insertLink = useCallback(() => {
    if (!editor || !linkUrl.trim()) {
      setLinkOpen(false);
      return;
    }
    const href = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    editor.chain().focus().setLink({ href }).run();
    setLinkOpen(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  useEffect(() => {
    if (linkOpen) linkInputRef.current?.focus();
  }, [linkOpen]);

  if (!editor) return null;

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors duration-150 focus-within:border-(--color-gold-primary) ${
        error ? 'border-red-500' : 'border-(--color-border)'
      }`}
    >
      {/* ── Toolbar ── */}
      <div className="flex h-10 w-full">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={isActive('bold')}
          title="Đậm"
          className="rounded-tl-lg"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-(--color-text-dark)" aria-hidden="true">
            <path d="M13.5 15.5H10V12.5H13.5C13.8978 12.5 14.2794 12.658 14.5607 12.9393C14.842 13.2206 15 13.6022 15 14C15 14.3978 14.842 14.7794 14.5607 15.0607C14.2794 15.342 13.8978 15.5 13.5 15.5ZM10 6.5H13C13.3978 6.5 13.7794 6.65804 14.0607 6.93934C14.342 7.22064 14.5 7.60218 14.5 8C14.5 8.39782 14.342 8.77936 14.0607 9.06066C13.7794 9.34196 13.3978 9.5 13 9.5H10M15.6 10.79C16.57 10.11 17.25 9 17.25 8C17.25 5.74 15.5 4 13.25 4H7V18H14.04C16.14 18 17.75 16.3 17.75 14.21C17.75 12.69 16.89 11.39 15.6 10.79Z" fill="currentColor" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={isActive('italic')}
          title="Nghiêng"
          className="-ml-px"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-(--color-text-dark)" aria-hidden="true">
            <path d="M10 4V7H12.21L8.79 15H6V18H14V15H11.79L15.21 7H18V4H10Z" fill="currentColor" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={isActive('strike')}
          title="Gạch ngang"
          className="-ml-px"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-(--color-text-dark)" aria-hidden="true">
            <path d="M7.62432 9.37769C6.42432 7.07769 8.12432 4.37769 10.5243 3.87769C13.6243 2.87769 18.1243 4.27769 18.0243 8.07769H15.0243C15.0243 7.77769 14.9243 7.47769 14.9243 7.27769C14.7243 6.67769 14.3243 6.37769 13.7243 6.17769C12.9243 5.87769 11.6243 5.97769 10.9243 6.47769C9.42432 7.77769 10.8243 9.07769 12.4243 9.57769H7.82432C7.72432 9.47769 7.72432 9.37769 7.62432 9.37769ZM21.4243 12.5777V10.5777H3.42432V12.5777H13.0243C13.2243 12.6777 13.4243 12.6777 13.6243 12.7777C14.2243 13.0777 14.7243 13.2777 14.9243 13.8777C15.0243 14.2777 15.1243 14.7777 14.9243 15.1777C14.7243 15.6777 14.3243 15.8777 13.8243 16.0777C12.0243 16.5777 9.82432 15.8777 9.92432 13.6777H6.92432C6.82432 16.2777 9.02432 18.0777 11.4243 18.3777C15.2243 19.1777 19.7243 16.7777 17.7243 12.4777L21.4243 12.5777Z" fill="currentColor" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={isActive('orderedList')}
          title="Danh sách đánh số"
          className="-ml-px"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-(--color-text-dark)" aria-hidden="true">
            <path d="M7 13V11H21V13H7ZM7 19V17H21V19H7ZM7 7V5H21V7H7ZM3 8V5H2V4H4V8H3ZM2 17V16H5V20H2V19H4V18.5H3V17.5H4V17H2ZM4.25 10C4.44891 10 4.63968 10.079 4.78033 10.2197C4.92098 10.3603 5 10.5511 5 10.75C5 10.95 4.92 11.14 4.79 11.27L3.12 13H5V14H2V13.08L4 11H2V10H4.25Z" fill="currentColor" />
          </svg>
        </ToolbarButton>
        <div className="relative -ml-px">
          <ToolbarButton
            onClick={() => setLinkOpen((v) => !v)}
            active={isActive('link') || linkOpen}
            title="Liên kết"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-(--color-text-dark)" aria-hidden="true">
              <path d="M10.9619 13.1547C11.3719 13.5447 11.3719 14.1847 10.9619 14.5747C10.5719 14.9647 9.93189 14.9647 9.54189 14.5747C7.5919 12.6247 7.5919 9.4547 9.54189 7.5047L13.0819 3.9647C15.0319 2.0147 18.2019 2.0147 20.1519 3.9647C22.1019 5.9147 22.1019 9.0847 20.1519 11.0347L18.6619 12.5247C18.6719 11.7047 18.5419 10.8847 18.2619 10.1047L18.7319 9.6247C19.9119 8.4547 19.9119 6.5547 18.7319 5.3847C17.5619 4.2047 15.6619 4.2047 14.4919 5.3847L10.9619 8.9147C9.7819 10.0847 9.7819 11.9847 10.9619 13.1547ZM13.7819 8.9147C14.1719 8.5247 14.8119 8.5247 15.2019 8.9147C17.1519 10.8647 17.1519 14.0347 15.2019 15.9847L11.6619 19.5247C9.71189 21.4747 6.54189 21.4747 4.59189 19.5247C2.64189 17.5747 2.64189 14.4047 4.59189 12.4547L6.08189 10.9647C6.07189 11.7847 6.20189 12.6047 6.48189 13.3947L6.01189 13.8647C4.83189 15.0347 4.83189 16.9347 6.01189 18.1047C7.18189 19.2847 9.08189 19.2847 10.2519 18.1047L13.7819 14.5747C14.9619 13.4047 14.9619 11.5047 13.7819 10.3347C13.3719 9.9447 13.3719 9.3047 13.7819 8.9147Z" fill="currentColor" />
            </svg>
          </ToolbarButton>
          {linkOpen && (
            <div
              className="absolute top-full left-0 mt-1 z-30 flex gap-1.5 p-2 rounded-lg shadow-lg border"
              style={{ backgroundColor: '#ffffff', borderColor: 'var(--color-border)', minWidth: '200px' }}
            >
              <input
                ref={linkInputRef}
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); insertLink(); }
                  if (e.key === 'Escape') { setLinkOpen(false); setLinkUrl(''); }
                }}
                className="flex-1 text-xs border rounded px-2 py-1 outline-none"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <button
                type="button"
                onClick={insertLink}
                className="text-xs px-2 py-1 rounded font-semibold"
                style={{ backgroundColor: 'var(--color-gold-primary)', color: '#00101A' }}
              >
                OK
              </button>
            </div>
          )}
        </div>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={isActive('blockquote')}
          title="Trích dẫn"
          className="-ml-px"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-(--color-text-dark)" aria-hidden="true">
            <path d="M12.9999 6V14H14.8799L12.8799 18H18.6199L20.9999 13.24V6M14.9999 8H18.9999V12.76L17.3799 16H16.1199L18.1199 12H14.9999M2.99988 6V14H4.87988L2.87988 18H8.61988L10.9999 13.24V6M4.99988 8H8.99988V12.76L7.37988 16H6.11988L8.11988 12H4.99988V8Z" fill="currentColor" />
          </svg>
        </ToolbarButton>
        <div className="flex-1 flex items-center justify-end border border-(--color-border) -ml-px rounded-tr-lg px-4">
          <a
            href="/kudos/rules"
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-bold leading-6 tracking-[0.15px] text-(--color-link-red) hover:underline"
          >
            Tiêu chuẩn cộng đồng
          </a>
        </div>
      </div>

      {/* ── Editor area ── */}
      <div className="border-t border-(--color-border) relative">
        <EditorContent editor={editor} />

        {/* Mention dropdown */}
        {mentionMenu.open && mentionMenu.items.length > 0 && (
          <ul
            className="absolute z-20 bg-white rounded-lg shadow-lg border overflow-y-auto"
            style={{ top: '100%', left: '24px', minWidth: '160px', maxHeight: '160px', borderColor: 'var(--color-border)' }}
          >
            {mentionMenu.items.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-amber-50 transition-colors ${
                    i === mentionMenu.selectedIndex ? 'bg-amber-50 font-medium' : ''
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    mentionMenu.command?.({ id: item.id, label: item.label });
                    setMentionMenu({ open: false, items: [], selectedIndex: 0, command: null });
                  }}
                >
                  @{item.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="px-6 py-2 text-xs text-red-500 border-t border-(--color-border)">{error}</p>
      )}
    </div>
  );
}
