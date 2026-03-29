'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import type { KudosFeedItem } from '@/types/database';
import KudosHero from './KudosHero';
import HighlightSection from './HighlightSection';
import AllKudosSection from './AllKudosSection';
import SendKudosDialog from './SendKudosDialog';
import KudosSidebar from './KudosSidebar';
import SecretBoxDialog from './SecretBoxDialog';

// SpotlightBoard uses d3-cloud (browser-only, no SSR)
const SpotlightBoard = dynamic(() => import('./SpotlightBoard'), { ssr: false });

interface KudosClientProps {
  initialKudos: KudosFeedItem[];
  initialHighlights: KudosFeedItem[];
  currentUserId?: string;
}

export default function KudosClient({ initialKudos, initialHighlights, currentUserId }: KudosClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [secretBoxOpen, setSecretBoxOpen] = useState(false);
  const [hashtag, setHashtag] = useState('');
  const [department, setDepartment] = useState('');
  const [feedResetToken, setFeedResetToken] = useState(0);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  const handleHashtagChange = useCallback((h: string) => setHashtag(h), []);
  const handleDeptChange = useCallback((d: string) => setDepartment(d), []);
  const handleCardFilterChange = useCallback((filter: { hashtag?: string; department?: string }) => {
    if (filter.hashtag !== undefined) setHashtag(filter.hashtag);
    if (filter.department !== undefined) setDepartment(filter.department);
  }, []);

  const handleSendSuccess = useCallback(() => {
    setFeedResetToken((t) => t + 1);
    setSidebarRefreshKey((k) => k + 1);
  }, []);

  const handleSecretBoxOpened = () => {
    setSidebarRefreshKey((k) => k + 1);
  };

  return (
    <>
      {/* A — Hero Banner */}
      <KudosHero onOpenSendDialog={() => setDialogOpen(true)} />

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 py-12 flex flex-col gap-14">

        {/* B — Highlight Kudos */}
        <section>
          <HighlightSection
            initialHighlights={initialHighlights}
            hashtag={hashtag}
            department={department}
            onHashtagChange={handleHashtagChange}
            onDeptChange={handleDeptChange}
            currentUserId={currentUserId}
          />
        </section>

        {/* B.7 — Spotlight Board */}
        <section>
          <SpotlightBoard />
        </section>

        {/* C + D — All Kudos feed + Sidebar */}
        <section>
          <div className="flex flex-col gap-3 sm:gap-4 mb-8">
            <div className="w-full h-px" style={{ backgroundColor: 'var(--Details-Divider)' }} />
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[57px] xl:text-[57px] leading-8 sm:leading-10 md:leading-12 lg:leading-16 xl:leading-16 tracking-[-0.25px] font-normal" style={{ color: 'var(--Details-Text-Primary-1)' }}>ALL KUDOS</h2>
          </div>
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* C — Feed */}
            <div className="flex-1 min-w-0">
              <AllKudosSection
                initialKudos={initialKudos}
                hashtag={hashtag}
                department={department}
                currentUserId={currentUserId}
                feedResetToken={feedResetToken}
                onFilterChange={handleCardFilterChange}
              />
            </div>

            {/* D — Sidebar */}
            <div
              className="shrink-0"
              style={{ position: 'sticky', top: 'calc(var(--header-height) + 24px)', alignSelf: 'flex-start' }}
            >
              <KudosSidebar
                onOpenSecretBox={() => setSecretBoxOpen(true)}
                refreshKey={sidebarRefreshKey}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Dialogs */}
      <SendKudosDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSendSuccess}
      />
      <SecretBoxDialog
        isOpen={secretBoxOpen}
        onClose={() => setSecretBoxOpen(false)}
        onOpened={handleSecretBoxOpened}
      />
    </>
  );
}
