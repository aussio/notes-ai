'use client';

import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import InstallPWA from './InstallPWA';
import UpdateBanner from './UpdateBanner';
import OfflineStatus from './OfflineStatus';

interface MainLayoutProps {
  children: React.ReactNode;
  currentNoteTitle?: string;
  isSaving?: boolean;
  onDeleteNote?: () => void;
  onTitleChange?: (newTitle: string) => void;
  onToggleDebug?: () => void;
  isDebugVisible?: boolean;
}

export default function MainLayout({
  children,
  currentNoteTitle,
  isSaving,
  onDeleteNote,
  onTitleChange,
  onToggleDebug,
  isDebugVisible,
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-0">
        {/* Header */}
        <Header
          onToggleSidebar={toggleSidebar}
          currentNoteTitle={currentNoteTitle}
          isSaving={isSaving}
          onDelete={onDeleteNote}
          onTitleChange={onTitleChange}
          onToggleDebug={onToggleDebug}
          isDebugVisible={isDebugVisible}
        />

        {/* Main content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      {/* PWA Components */}
      <InstallPWA />
      <UpdateBanner />
      <OfflineStatus />
    </div>
  );
}
