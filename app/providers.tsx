"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/forum/auth-gate";
import { TestProvider } from "@/components/forum/test-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TestProvider>
        <AuthGate>{children}</AuthGate>
      </TestProvider>
    </AuthProvider>
  );
}
