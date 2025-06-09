'use client';

import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  currentNoteTitle?: string;
  isSaving?: boolean;
  onDeleteNote?: () => void;
  onTitleChange?: (newTitle: string) => void;
}

export default function MainLayout({
  children,
  currentNoteTitle,
  isSaving,
  onDeleteNote,
  onTitleChange,
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
        />

        {/* Main content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
