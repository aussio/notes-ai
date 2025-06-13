'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Settings, Shield, Bell, Palette } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { useUser, useAuthStore } from '@/store/authStore';
import Image from 'next/image';

export default function ProfilePage() {
  const router = useRouter();
  const user = useUser();
  const { signOut } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Failed to log out:', error);
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-3 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Image
                  src="/teal_duck_logo.png"
                  alt="Teal Duck Logo"
                  width={32}
                  height={32}
                />
                <span className="text-lg font-semibold">Back to Notes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Profile Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Profile Settings
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Account Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Created
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Sections (Placeholders) */}
            <div className="space-y-6">
              {/* Security Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gray-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Security & Privacy
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="opacity-60">
                      <button
                        disabled
                        className="text-left w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          Change Password
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Update your account password
                        </div>
                      </button>
                    </div>
                    <div className="opacity-60">
                      <button
                        disabled
                        className="text-left w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          Two-Factor Authentication
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Add an extra layer of security
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Preferences
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="opacity-60">
                      <button
                        disabled
                        className="text-left w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Theme Settings
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Customize your interface
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                    <div className="opacity-60">
                      <button
                        disabled
                        className="text-left w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Notifications
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Manage notification preferences
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coming Soon Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Coming Soon:</strong> Additional profile settings and
                customization options will be available in future updates.
              </p>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800">
              <div className="p-6 border-b border-red-200 dark:border-red-800">
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
                  Account Actions
                </h2>
              </div>
              <div className="p-6">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
