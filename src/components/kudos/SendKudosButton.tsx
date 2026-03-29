'use client';



interface SendKudosButtonProps {
  onOpen: () => void;
}

export default function SendKudosButton({ onOpen }: SendKudosButtonProps) {
  return (
    <button
      onClick={onOpen}
      className="w-full max-w-xl flex items-center gap-3 px-5 py-3 rounded-full border text-left transition-all duration-150 hover:bg-[rgba(255,234,158,0.08)]"
      style={{
        borderColor: 'var(--Details-Border)',
        backgroundColor: 'var(--Details-Container)',
        color: 'var(--Details-Text-Secondary-2)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm">Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?</span>
    </button>
  );
}
