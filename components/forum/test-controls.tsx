"use client";

import { useState } from "react";
import {
  FlaskConical,
  Flame,
  Shield,
  EyeOff,
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTestContext } from "./test-context";
import { cn } from "@/lib/utils";

export function TestControls() {
  const [expanded, setExpanded] = useState(false);
  const {
    panicMode,
    togglePanicMode,
    currentRole,
    cycleRole,
    anonymitySimulated,
    toggleAnonymitySimulated,
    simulatedName,
    setSimulatedName,
  } = useTestContext();

  const roleLabels: Record<string, string> = {
    student: "Student",
    ta: "TA",
    instructor: "Instructor",
  };

  const roleBadgeColors: Record<string, string> = {
    student: "bg-teal-100 text-teal-700 border-teal-300",
    ta: "bg-purple-100 text-purple-700 border-purple-300",
    instructor: "bg-blue-100 text-blue-700 border-blue-300",
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {/* Collapsed: floating trigger button */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          title="Open Test Controls"
        >
          <FlaskConical className="w-4 h-4" />
          <span className="hidden sm:inline">Test UI</span>
        </button>
      )}

      {/* Expanded: test panel */}
      {expanded && (
        <div className="w-72 bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold">UI Test Controls</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="p-1 rounded hover:bg-gray-700 transition-colors"
              title="Collapse"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Controls */}
          <div className="p-4 space-y-4">
            {/* 1. Toggle Panic Mode */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                1. Panic Mode
              </label>
              <button
                onClick={togglePanicMode}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-sm font-medium",
                  panicMode
                    ? "bg-gradient-to-r from-red-600 to-orange-500 border-red-500 text-white shadow-md shadow-red-900/30"
                    : "bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500"
                )}
              >
                <Flame
                  className={cn(
                    "w-4 h-4",
                    panicMode ? "animate-pulse text-yellow-300" : "text-gray-400"
                  )}
                />
                <span>Toggle Panic Mode</span>
                <span
                  className={cn(
                    "ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full",
                    panicMode
                      ? "bg-white/20 text-white"
                      : "bg-gray-700 text-gray-400"
                  )}
                >
                  {panicMode ? "ON" : "OFF"}
                </span>
              </button>
              <p className="text-[10px] text-gray-500 mt-1.5">
                {panicMode
                  ? "Active — Feed filtered to high-activity questions, orange-red theme"
                  : "Inactive — Normal feed view"}
              </p>
            </div>

            {/* 2. Toggle Role View */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                2. Role View
              </label>
              <button
                onClick={cycleRole}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-600 bg-gray-800 hover:border-gray-500 transition-all text-sm font-medium"
              >
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Current Role:</span>
                <span
                  className={cn(
                    "ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full border",
                    roleBadgeColors[currentRole]
                  )}
                >
                  {roleLabels[currentRole]}
                </span>
              </button>
              <p className="text-[10px] text-gray-500 mt-1.5">
                Click to cycle: Student &rarr; TA &rarr; Instructor &rarr; Student...
              </p>
              <p className="text-[10px] text-gray-500">
                {currentRole === "student"
                  ? "Student view — no verify button visible"
                  : currentRole === "ta"
                  ? "TA view — [Verify This Answer] button visible on student answers"
                  : "Instructor view — [Verify This Answer] button visible on all student answers"}
              </p>
            </div>

            {/* 3. Simulated Anonymity Input */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                3. Anonymity Simulation
              </label>
              <button
                onClick={toggleAnonymitySimulated}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-sm font-medium",
                  anonymitySimulated
                    ? "bg-purple-900/50 border-purple-500 text-purple-200"
                    : "bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500"
                )}
              >
                <EyeOff
                  className={cn(
                    "w-4 h-4",
                    anonymitySimulated ? "text-purple-400" : "text-gray-400"
                  )}
                />
                <span>Simulated Anonymity</span>
                <span
                  className={cn(
                    "ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full",
                    anonymitySimulated
                      ? "bg-purple-500/30 text-purple-200"
                      : "bg-gray-700 text-gray-400"
                  )}
                >
                  {anonymitySimulated ? "ON" : "OFF"}
                </span>
              </button>
              {anonymitySimulated && (
                <div className="mt-2">
                  <Input
                    placeholder="Fake name for preview..."
                    value={simulatedName}
                    onChange={(e) => setSimulatedName(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white text-xs h-8 placeholder:text-gray-500"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    This name appears in Live Preview when anonymity is active
                  </p>
                </div>
              )}
              {!anonymitySimulated && (
                <p className="text-[10px] text-gray-500 mt-1.5">
                  When ON, Question Creator shows fake name in Live Preview
                </p>
              )}
            </div>

            {/* Reset All */}
            <div className="pt-2 border-t border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (panicMode) togglePanicMode();
                  while (currentRole !== "student") cycleRole();
                  if (anonymitySimulated) toggleAnonymitySimulated();
                }}
                className="w-full gap-2 text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All to Default
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
