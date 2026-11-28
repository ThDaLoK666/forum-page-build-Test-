"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/forum/auth-gate";
import { TestProvider } from "@/components/forum/test-context";
import { StudyTimer } from "@/components/forum/study-timer";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TestProvider>
        <AuthGate>{children}</AuthGate>
        <StudyTimer />
      </TestProvider>
    </AuthProvider>
  );
}
