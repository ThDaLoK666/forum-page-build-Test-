"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">เกิดข้อผิดพลาด</h1>
        <p className="text-sm text-muted-foreground mb-6">
          ระบบขัดข้องชั่วคราว ลองโหลดใหม่อีกครั้ง — ข้อมูลของคุณยังอยู่ครบ
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono mb-6">
            error id: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-2">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            ลองใหม่
          </Button>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              กลับหน้าแรก
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
