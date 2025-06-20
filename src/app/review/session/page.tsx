'use client';

import React from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import { ReviewInterface } from '@/components/review/ReviewInterface';

export default function ReviewSessionPage() {
  return (
    <AuthGuard>
      <ReviewInterface />
    </AuthGuard>
  );
}
