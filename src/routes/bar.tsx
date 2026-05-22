import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/Topbar";
import { Clock, Sparkles, Wine, Beer, GlassWater, Crown } from "lucide-react";

export const Route = createFileRoute("/bar")({
  head: () => ({
    meta: [
      { title: "bar · casamento d & l" },
      { name: "description", content: "cardápio do bar — drinks, cervejas, premium e bebidas" },
    ],
  }),
  component: BarPage,
});

type Drink = { name: string; highlight?: boolean; badge?: string; note?: string };

const COM_ALCOOL: Drink[] = [
  { name: "Caipiroska Black" },
  { name: "Caipiroska Uva com Manjericão" },
  { name: "Aperol Spritz" },
  { name: "Negroni" },
  { name: "Moscow Mule" },
  { name: "Whisky Sour" },
  { name: "Pink Fire", highlight: true, badge: "drink da noiva", note: "especial da noiva ♡" },
  { name: "Alma Verde" },
  { name: "Abelha Rainha" },
  { name: "43 Sour" },
];

const SEM_ALCOOL: Drink[] = [
  { name: "Caipirinha" },
  { name: "Moscow Mule" },
];

const CERVEJAS: Drink[] = [
  { name: "Chopp Stannis Pilsen" },
  { name: "Heineken Zero" },
];

const PREMIUM: Drink[] = [
  { name: "Whisky Black Label" },
  { name: "Chandon Brut" },
];

const BEBIDAS: Drink[] = [
  { name: "Água sem gás" },
  { name: "Água com gás" },
  { name: "Refrigerante", note: "normal e zero" },
  { name: "Água tônica" },
  { name: "Suco Del Valle 290ml", note: "vários sabores" },
  { name: "Red Bull 250ml" },
  { name: "Choco Leite 200ml" },
];

function Card({ d }: { d: Drink }) {
  if (d.highlight) {
    return (
      <div className="relative rounded-2xl p-4 border-2 border-rose bg-rose-bg shadow-elegant overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-rose-light/40 blur-xl" />
        <div className="relative flex items-start justify-between gap-2">
          <div>
            <div className="font-serif text-xl text-rose-deep flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> {d.name}
            </div>
            {d.note && <div className="text-xs text-rose-deep/80 mt-1">{d.note}</div>}
          </div>
          {d.badge && (
            <span className="shrink-0 text-[10px] uppercase tracking-wider bg-rose-deep text-white px-2 py-1 rounded-full font-medium">
              {d.badge}
            </span>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl p-3 bg-card border border-border">
      <div className="font-medium text-foreground">{d.name}</div>
      {d.note && <div className="text-xs text-muted-foreground mt-0.5">{d.note}</div>}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  items,
  footer,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  items: Drink[];
  footer?: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="label-eyebrow flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5" />
            <span>{title}</span>
          </div>
          {subtitle && <h2 className="font-serif text-2xl text-foreground mt-1">{subtitle}</h2>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {items.map((d) => (
          <Card key={d.name} d={d} />
        ))}
      </div>
      {footer && <p className="text-xs text-muted-foreground italic pt-1">{footer}</p>}
    </section>
  );
}

function BarPage() {
  return (
    <div className="min-h-screen bg-watercolor">
      <Topbar />
      <main className="max-w-md mx-auto px-4 pt-6 pb-8 space-y-8">
        <header className="text-center space-y-2">
          <div className="label-eyebrow">cardápio</div>
          <h1 className="font-serif text-4xl text-rose-deep">bar</h1>
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-white-soft border border-border rounded-full px-3 py-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>aberto das 17:30 às 01:30 · 8h corridas</span>
          </div>
        </header>

        <section className="space-y-4">
          <div className="label-eyebrow flex items-center gap-1.5">
            <Wine className="w-3.5 h-3.5" />
            <span>drinks</span>
          </div>

          <div>
            <h3 className="font-serif text-xl text-foreground mb-2">com álcool</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {COM_ALCOOL.map((d) => (
                <Card key={d.name} d={d} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-serif text-xl text-foreground mb-2">sem álcool</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SEM_ALCOOL.map((d) => (
                <Card key={d.name} d={d} />
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic pt-1">
            destilados da casa: Vodka Absolut, Gin Tanqueray, Licor 43, Whisky Jack Daniel's, Bitter Campari e Rum Bacardi
          </p>
        </section>

        <Section icon={Beer} title="cervejas & chopp" subtitle="cervejas & chopp" items={CERVEJAS} />
        <Section icon={Crown} title="premium" subtitle="bebidas premium" items={PREMIUM} />
        <Section icon={GlassWater} title="bebidas" subtitle="bebidas" items={BEBIDAS} />
      </main>
    </div>
  );
}
