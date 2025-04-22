'use client';

import React from 'react';
import { Provider } from './provider'; // Assuming provider is in the same directory

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // Any other client-side hooks or context providers needed at the layout level can go here
  return <Provider>{children}</Provider>;
}
