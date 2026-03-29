'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';

const SendKudosDialog = dynamic(() => import('@/components/kudos/SendKudosDialog'), {
  ssr: false,
});

export default function WidgetButton() {
  const [open, setOpen] = useState(false);
  const [kudosDialogOpen, setKudosDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <>
      <div
        ref={containerRef}
        className="fixed z-50 bottom-20 2xl:bottom-10 right-4 xl:right-[3%] 2xl:right-[5%] min-[2000px]:right-[15%]!"
        role="region"
        aria-label="Quick actions"
      >
        {open ? (
          /* Expanded menu */
          <div className="flex flex-col items-end gap-5" role="menu">
            {/* Thể lệ */}
            <Link
              href="/kudos/rules"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="group flex items-center gap-2 px-4 py-4 rounded bg-[#FFEA9E] text-[#00101A] hover:bg-white hover:shadow-lg transition-colors duration-150 w-37.25 h-16"
              aria-label="View Rules"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current group-hover:text-current" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor" />
              </svg>
              <span className="text-2xl font-normal leading-8">Thể lệ</span>
            </Link>

            {/* Viết KUDOS */}
            <button
              role="menuitem"
              aria-label="Write Kudos"
              className="group flex items-center gap-2 px-4 py-4 rounded bg-[#FFEA9E] text-[#00101A] hover:bg-white hover:shadow-lg transition-colors duration-150 w-52 h-16"
              onClick={() => { setOpen(false); setKudosDialogOpen(true); }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current group-hover:text-current" aria-hidden="true">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
              </svg>
              <span className="text-2xl font-normal leading-8">Viết KUDOS</span>
            </button>

            {/* Close */}
            <button
              role="menuitem"
              aria-label="Cancel"
              className="flex items-center justify-center p-4 rounded-full bg-[#D4271D] hover:bg-[#b83a31] hover:shadow-lg transition-colors duration-150 w-14 h-14"
              onClick={() => setOpen(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="white" />
              </svg>
            </button>
          </div>
        ) : (
          /* Collapsed pill */
          <button
            className="group flex items-center gap-2 px-4 py-4 rounded-[100px] bg-[#FFEA9E] text-[#00101A] hover:bg-white hover:shadow-[0_0_12px_0_#FAE287] transition-all w-26.25 h-16 border-0 hover:border hover:border-[rgba(0,0,0,0.06)]"
            style={{ boxShadow: 'rgb(250, 226, 135) 0px 0px 6px 0px' }}
            aria-label="Open quick actions"
            aria-expanded={false}
            onClick={() => setOpen(true)}
          >
            <Image
              src="/assets/homepage/icons/widget-pencil.svg"
              alt="pencil"
              width={24}
              height={24}
            />
            <span className="text-current text-2xl font-normal leading-8">/</span>
            <span className="text-current">
              <Image
                src="/assets/homepage/icons/widget-saa.svg"
                alt="sun"
                width={24}
                height={24}
              />
            </span>
          </button>
        )}
      </div>

      <SendKudosDialog
        isOpen={kudosDialogOpen}
        onClose={() => setKudosDialogOpen(false)}
        onSuccess={() => setKudosDialogOpen(false)}
      />
    </>
  );
}
