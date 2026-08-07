"use client";

import { ReactNode } from "react";
import { TestProvider } from "@/components/forum/test-context";
import { TestControls } from "@/components/forum/test-controls";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TestProvider>
      {children}
      <TestControls />
    </TestProvider>
  );
}
