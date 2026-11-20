"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/lib/auth";

type UserRole = "student" | "ta" | "instructor";

interface TestContextValue {
  panicMode: boolean;
  togglePanicMode: () => void;
  currentRole: UserRole;
  cycleRole: () => void;
  anonymitySimulated: boolean;
  toggleAnonymitySimulated: () => void;
  simulatedName: string;
  setSimulatedName: (name: string) => void;
}

const TestContext = createContext<TestContextValue | null>(null);

export function useTestContext() {
  const ctx = useContext(TestContext);
  if (!ctx) throw new Error("useTestContext must be used within TestProvider");
  return ctx;
}

const roleCycle: UserRole[] = ["student", "ta", "instructor"];

export function TestProvider({ children }: { children: ReactNode }) {
  const [panicMode, setPanicMode] = useState(false);
  const { uiRole: currentRole } = useAuth();
  const [anonymitySimulated, setAnonymitySimulated] = useState(false);
  const [simulatedName, setSimulatedName] = useState("Test Student");

  const togglePanicMode = useCallback(() => setPanicMode((p) => !p), []);

  const cycleRole = useCallback(() => {}, []);

  const toggleAnonymitySimulated = useCallback(
    () => setAnonymitySimulated((p) => !p),
    []
  );

  return (
    <TestContext.Provider
      value={{
        panicMode,
        togglePanicMode,
        currentRole,
        cycleRole,
        anonymitySimulated,
        toggleAnonymitySimulated,
        simulatedName,
        setSimulatedName,
      }}
    >
      {children}
    </TestContext.Provider>
  );
}
