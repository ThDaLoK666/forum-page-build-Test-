import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-secondary">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-5xl font-bold text-foreground mb-2">404</p>
        <h1 className="text-xl font-semibold text-foreground mb-2">ไม่พบหน้านี้</h1>
        <p className="text-sm text-muted-foreground mb-6">
          กระทู้อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง
        </p>
        <Link href="/">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            กลับหน้าแรก
          </Button>
        </Link>
      </div>
    </div>
  );
}
