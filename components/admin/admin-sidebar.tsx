"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Glasses,
  Layers,
  ImageIcon,
  FileText,
  Inbox,
  Settings,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produits", icon: Glasses },
  { href: "/admin/collections", label: "Collections", icon: Layers },
  { href: "/admin/media", label: "Médias", icon: ImageIcon },
  { href: "/admin/content", label: "Contenus", icon: FileText },
  { href: "/admin/contact-requests", label: "Demandes", icon: Inbox },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/admin/dashboard" className="font-display text-lg font-bold uppercase tracking-[0.3em]">
          Additive<span className="text-accent-blue">.</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Navigation admin">
        {NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" /> Voir le site
        </Link>
      </div>
    </aside>
  );
}
