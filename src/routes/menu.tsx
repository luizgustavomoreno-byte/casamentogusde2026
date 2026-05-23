import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/Topbar";

export const Route = createFileRoute("/menu")({
  component: MenuPage,
  head: () => ({
    meta: [
      { title: "Menu · Casamento D & L" },
      { name: "description", content: "Menu da noite por Bodega do Richter" },
    ],
  }),
});

type Item = { name: string; desc?: string };

function Card({ item, center = false }: { item: Item; center?: boolean }) {
  return (
    <div
      className={`bg-card border border-[var(--border-soft)] rounded-xl px-4 py-3 font-serif text-rose-deep shadow-soft ${
        center ? "text-center" : ""
      }`}
    >
      <div className="text-[15px] leading-snug">{item.name}</div>
      {item.desc && (
        <div className="font-sans italic text-[11px] text-[var(--text-tertiary)] mt-1 leading-snug">
          {item.desc}
        </div>
      )}
    </div>
  );
}

function SectionHead({
  time,
  title,
  tag,
  emoji,
  sub,
}: {
  time?: string;
  title: string;
  tag?: string;
  emoji?: string;
  sub?: string;
}) {
  return (
    <>
      <div className="flex items-baseline justify-center gap-3 flex-wrap mb-1">
        {time && (
          <span className="font-serif italic text-[13px] text-[var(--text-tertiary)]">
            {time}
          </span>
        )}
        <h2 className="font-serif text-[26px] md:text-[32px] text-rose-deep m-0">
          {title}
        </h2>
        {tag && (
          <span className="bg-rose-bg text-rose-deep text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full">
            {tag}
          </span>
        )}
        {emoji && <span className="text-lg">{emoji}</span>}
      </div>
      {sub && (
        <div className="text-center font-serif italic text-[12px] text-[var(--text-tertiary)] mb-2">
          {sub}
        </div>
      )}
      <div className="h-px bg-[var(--border-soft)] opacity-60 mb-5" />
    </>
  );
}

function MenuPage() {
  const frios: Item[] = [
    { name: "Seleção de queijos especiais", desc: "parmesão, queijo azul, ementhal e gouda" },
    { name: "Seleção de charcutarias", desc: "copa defumada, parma, salame italiano e milano" },
    { name: "Pães de fermentação natural", desc: "multigrãos, abóbora, italiano, gorgonzola e nozes" },
    { name: "Crostatas" },
    { name: "Focaccia", desc: "alecrim, tomate baby e sal grosso" },
    { name: "Brie em massa filo", desc: "geleia de morangos e vermute" },
    { name: "Azeitonas temperadas", desc: "siciliano, alecrim, laranja, pimenta rosa, louro" },
    { name: "Hommus" },
    { name: "Coalhada seca", desc: "nozes, pimenta síria e mel" },
    { name: "Antepasto de berinjela" },
    { name: "Terrine de gorgonzola", desc: "com damascos" },
    { name: "Pastinha de alho poró", desc: "e vinho branco" },
    { name: "Stracciatella cremosa", desc: "tomatinhos demi-sec e gremolata de manjericão" },
    { name: "Steak tartare", desc: "chips de batata doce" },
  ];

  const tempo1: Item[] = [
    { name: "Arancini", desc: "provolone defumado" },
    { name: "Dadinhos de tapioca", desc: "geleia de pimenta e melado" },
    { name: "Mini croque", desc: "linguiça Blumenau e catupiry" },
  ];

  const tempo2: Item[] = [
    { name: "Penne ao molho Alfredo" },
    { name: "Salmão em crosta de castanhas", desc: "e parmesão · risoto de limão siciliano" },
    { name: "Purê de cabotiá defumada", desc: "cogumelos, carne seca e crispy de couve" },
    { name: "Risoto de costela", desc: "confitada" },
  ];

  const madrugada: Item[] = [
    { name: "Mini burguer", desc: "pão, carne e queijo" },
    { name: "Batatinha fina", desc: "crocante" },
  ];

  return (
    <div className="min-h-screen bg-watercolor">
      <Topbar />
      <main className="pb-24 px-4 sm:px-6 pt-6">
        <div className="max-w-3xl mx-auto">
          <header className="text-center mb-2">
            <h1 className="font-serif text-5xl md:text-6xl text-rose-deep leading-none mb-1">
              Menu
            </h1>
            <div className="font-serif italic text-sm text-[var(--text-tertiary)]">
              por Bodega do Richter
            </div>
          </header>

          <div className="flex items-center justify-center gap-2 max-w-sm mx-auto my-7 px-4 py-2 bg-white/50 border border-[var(--border-soft)] rounded-full font-serif italic text-[13px] text-rose-deep">
            🕯️ <span>a noite servida em 4 momentos</span>
          </div>

          <section className="mb-12">
            <SectionHead time="18h — 24h" title="Ilha de Frios" />
            <div className="grid grid-cols-2 gap-2.5">
              {frios.map((i) => <Card key={i.name} item={i} />)}
            </div>
          </section>

          <section className="mb-12">
            <SectionHead time="19h — 21:30h" title="Coquetel Volante" tag="1º TEMPO" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {tempo1.map((i) => <Card key={i.name} item={i} center />)}
            </div>
          </section>

          <section className="mb-12">
            <SectionHead time="21:30h — 23h" title="Coquetel Volante" tag="2º TEMPO" />
            <div className="grid grid-cols-2 gap-2.5">
              {tempo2.map((i) => <Card key={i.name} item={i} />)}
            </div>
          </section>

          <section className="mb-10">
            <SectionHead
              time="01:30h"
              title="Lanche da Madrugada"
              emoji="🌙"
              sub="pra quem ficou até o fim ♡"
            />
            <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
              {madrugada.map((i) => <Card key={i.name} item={i} center />)}
            </div>
          </section>

          <div
            className="relative rounded-3xl p-6 mt-6"
            style={{
              background: "linear-gradient(135deg, #FFF4E8 0%, #FCE8E0 100%)",
              border: "1.5px dashed #E8B89A",
            }}
          >
            <span
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] tracking-wider uppercase px-3.5 py-1 rounded-full"
              style={{ background: "#D89070" }}
            >
              ✦ especial
            </span>
            <div className="font-serif text-3xl text-center" style={{ color: "#A05D3E" }}>
              Menu Kids
            </div>
            <div className="font-serif italic text-[13px] text-center text-[var(--text-tertiary)]">
              pros pequenos da festa ♡
            </div>
            <div className="h-px opacity-50 my-4" style={{ background: "#E8B89A" }} />
            <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
              <div className="bg-card border border-[#F0D5C0] rounded-xl px-3 py-3 text-center font-serif" style={{ color: "#A05D3E" }}>
                Mini burguer
              </div>
              <div className="bg-card border border-[#F0D5C0] rounded-xl px-3 py-3 text-center font-serif" style={{ color: "#A05D3E" }}>
                Batatinha crocante
              </div>
            </div>
            <div
              className="mt-5 flex items-center gap-3 rounded-xl px-4 py-3 max-w-xl mx-auto font-serif italic text-[13px] leading-snug"
              style={{ background: "rgba(255,255,255,0.6)", color: "#8E5A40" }}
            >
              <span className="text-xl">👋</span>
              <span>peça ao garçom mais próximo · ele leva o lanche fresquinho até a criança</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
