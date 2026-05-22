import { Link } from "@tanstack/react-router";
import { Home, Images, Trophy, Tv, Wine } from "lucide-react";

const ITEMS = [
  { to: "/", label: "início", Icon: Home, exact: true },
  { to: "/galeria", label: "galeria", Icon: Images, exact: false },
  { to: "/ranking", label: "ranking", Icon: Trophy, exact: false },
  { to: "/bar", label: "bar", Icon: Wine, exact: false },
  { to: "/tv", label: "carrossel", Icon: Tv, exact: false },
] as const;

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-[var(--bg-cream-deep)]/95 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto max-w-md grid grid-cols-5">
        {ITEMS.map(({ to, label, Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact }}
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-rose-deep transition-colors"
              activeProps={{
                className:
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] uppercase tracking-wider text-rose-deep font-medium",
              }}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
