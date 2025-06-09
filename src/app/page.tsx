import MainLayout from '@/components/layout/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Welcome to Notes
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your local-first note-taking app. Select a note from the sidebar to
            get started, or create a new note to begin writing.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 All your notes are stored locally on your device. No internet
              connection required!
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
