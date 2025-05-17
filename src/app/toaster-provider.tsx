"use client";

import { Toaster } from "sonner";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      theme="dark"
      toastOptions={{
        style: {
          background: '#1f2937',
          border: '1px solid #3b82f6',
          color: 'white',
        }
      }}
    />
  );
} 