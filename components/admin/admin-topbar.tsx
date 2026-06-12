"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminTopbar({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
      <p className="text-sm text-muted">
        Connecté en tant que <span className="font-medium text-foreground">{userName}</span>
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
      >
        <LogOut className="h-4 w-4" /> Déconnexion
      </Button>
    </header>
  );
}
