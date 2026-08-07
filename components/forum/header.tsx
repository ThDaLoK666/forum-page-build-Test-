"use client";

import { Search, Plus, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onCreatePost: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ onCreatePost, searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/images/ict-logo.png"
            alt="ICT Mahidol University"
            className="h-10 w-auto object-contain"
          />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground">ICT Forum</h1>
            <p className="text-xs text-muted-foreground">Mahidol University</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for posts, subjects, or topics..."
              className="w-full pl-10 pr-4 bg-secondary/50 border-transparent focus-visible:border-input"
            />
          </div>
        </div>

{/* Actions */}
        <div className="flex items-center gap-2">
          <Button onClick={onCreatePost} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Post</span>
          </Button>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
          </Button>

          <Button variant="ghost" size="icon">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
