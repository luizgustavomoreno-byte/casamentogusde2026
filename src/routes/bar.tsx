import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/Topbar";

export const Route = createFileRoute("/bar")({
  head: () => ({
    meta: [
      { title: "Bar · Casamento D & L" },
      { name: "description", content: "Cardápio do bar — drinks, cervejas, premium e bebidas" },
    ],
  }),
  component: BarPage,
});

type Item = { name: string; sub?: string; desc?: string };

function PlainCard({ item, small = false }: { item: Item; small?: boolean }) {
  return (
    <div
      className="bg-card rounded-xl px-4 py-3.5 text-center font-serif text-rose-deep"
      style={{ border: "1px solid #EAD4D9", fontSize: small ? 15 : 16, lineHeight: 1.25 }}
    >
      {item.name}
      {item.sub && (
        <span className="block text-[13px] mt-0.5">{item.sub}</span>
      )}
      {item.desc && (
        <div className="text-[11px] mt-0.5" style={{ color: "#B89098" }}>
          {item.desc}
        </div>
      )}
    </div>
  );
}

function SpecialCard({
  name,
  badge,
  variant,
}: {
  name: string;
  badge: string;
  variant: "bride" | "groom";
}) {
  const styles =
    variant === "bride"
      ? { bg: "#F8E5EC", border: "#D4798F", color: "#D4798F", badgeBg: "#D4798F" }
      : { bg: "#E8F0F5", border: "#6B8FA8", color: "#4A6B82", badgeBg: "#6B8FA8" };
  return (
    <div
      className="relative rounded-xl px-4 py-3.5 text-center font-serif"
      style={{
        background: styles.bg,
        border: `1.5px solid ${styles.border}`,
        color: styles.color,
        fontSize: 17,
      }}
    >
      <span
        className="absolute left-1/2 -translate-x-1/2 -top-2.5 text-white text-[9px] tracking-wider uppercase px-2.5 py-0.5 rounded-full font-sans whitespace-nowrap"
        style={{ background: styles.badgeBg }}
      >
        {badge}
      </span>
      {name}
    </div>
  );
}

function StarCard({ name }: { name: string }) {
  return (
    <div
      className="relative bg-card rounded-xl px-4 py-3.5 text-center font-serif text-rose-deep"
      style={{ border: "1px solid #EAD4D9", fontSize: 16 }}
    >
      <span className="absolute top-2.5 right-3 text-[11px]" style={{ color: "#C9A8B0" }}>
        ✦
      </span>
      {name}
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-2xl sm:text-3xl text-rose-deep text-center m-0">
      {children}
    </h2>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-serif italic text-[13px] text-center mb-1" style={{ color: "#B89098" }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px opacity-60 mb-6" style={{ background: "#EAD4D9" }} />;
}

function Mini({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-serif italic text-[14px] mb-3 pl-1" style={{ color: "#B89098" }}>
      {children}
    </div>
  );
}

function BarPage() {
  return (
    <div className="min-h-screen bg-cream-gradient">
      <Topbar />
      <main className="px-5 pt-8 pb-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-serif text-5xl sm:text-6xl text-rose-deep text-center mb-10 leading-none">
            Bar
          </h1>

          <section className="mb-12">
            <H2>Drinks</H2>
            <Sub>servidos das 17:30 às 01:30 · 8 horas corridas</Sub>
            <div
              className="font-serif italic text-[12px] text-center mb-4"
              style={{ color: "#C9A8B0" }}
            >
              se a pista estiver bombando, a gente estende ♡
            </div>
            <Divider />

            <Mini>com álcool</Mini>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-7">
              <PlainCard item={{ name: "Caipiroska Black" }} />
              <PlainCard item={{ name: "Caipiroska Uva", sub: "com manjericão" }} />
              <PlainCard item={{ name: "Aperol Spritz" }} />
              <PlainCard item={{ name: "Negroni" }} />
              <PlainCard item={{ name: "Moscow Mule" }} />
              <PlainCard item={{ name: "Whisky Sour" }} />
              <SpecialCard name="Pink Fire" badge="♡ drink da noiva" variant="bride" />
              <PlainCard item={{ name: "Alma Verde" }} />
              <PlainCard item={{ name: "Abelha Rainha" }} />
              <SpecialCard name="43 Sour" badge="♢ drink do noivo" variant="groom" />
            </div>

            <Mini>sem álcool</Mini>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
              <PlainCard item={{ name: "Caipirinha" }} />
              <PlainCard item={{ name: "Moscow Mule" }} />
            </div>

            <p
              className="font-serif italic text-[12px] text-center px-5 leading-relaxed mt-5"
              style={{ color: "#B89098" }}
            >
              destilados da casa · Vodka Absolut · Gin Tanqueray · Licor 43 · Whisky Jack Daniel's · Bitter Campari · Rum Bacardi
            </p>
          </section>

          <section className="mb-12">
            <H2>Cervejas &amp; Chopp</H2>
            <Sub>disponíveis em self-service na mesa do chopp</Sub>
            <Divider />
            <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
              <PlainCard item={{ name: "Chopp Stannis Pilsen" }} />
              <PlainCard item={{ name: "Heineken Zero" }} />
            </div>
          </section>

          <section className="mb-12">
            <H2>Espumantes &amp; Whisky</H2>
            <Sub>edição limitada · enquanto durar a reserva ♡</Sub>
            <div
              className="font-serif italic text-[12px] text-center mb-4"
              style={{ color: "#C9A8B0" }}
            >
              peça aos garçons
            </div>
            <Divider />
            <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
              <StarCard name="Chandon Brut" />
              <StarCard name="Whisky Black Label" />
            </div>
          </section>

          <section className="mb-4">
            <H2>Bebidas</H2>
            <div className="h-px opacity-60 my-5" style={{ background: "#EAD4D9" }} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <PlainCard item={{ name: "Água sem gás" }} small />
              <PlainCard item={{ name: "Água com gás" }} small />
              <PlainCard item={{ name: "Refrigerante", desc: "normal e zero" }} small />
              <PlainCard item={{ name: "Água tônica" }} small />
              <PlainCard item={{ name: "Suco Del Valle", desc: "vários sabores" }} small />
              <PlainCard item={{ name: "Red Bull" }} small />
              <PlainCard item={{ name: "Choco Leite" }} small />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
