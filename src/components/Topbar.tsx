import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, signOut } from "@/hooks/useAuth";
import { initials, firstName } from "@/lib/media";
import { LogOut, ChevronDown, Shield } from "lucide-react";

export function Topbar() {
  const { user, profile, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-cream-deep)]/85 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-baseline gap-2 shrink-0">
          <span className="font-serif text-lg text-rose-deep">Casamento D &amp; L</span>
          <span className="hidden sm:inline text-[11px] uppercase tracking-widest text-muted-foreground">
            · 30·05·2026
          </span>
        </Link>
        {user && profile && (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-card border border-border hover:border-rose-light transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-rose flex items-center justify-center text-primary-foreground text-xs font-medium">
                {initials(profile.name)}
              </span>
              <span className="hidden sm:inline text-sm text-foreground">{firstName(profile.name)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl shadow-elegant border border-border overflow-hidden">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium truncate">{profile.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                </div>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors"
                  >
                    <Shield className="w-4 h-4" /> admin
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors"
                >
                  <LogOut className="w-4 h-4" /> sair
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
