import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Topbar } from "@/components/Topbar";
import { SignedImage } from "@/components/SignedImage";
import { Lightbox, type MemoryFull } from "@/components/Lightbox";


export const Route = createFileRoute("/ranking")({
  head: () => ({ meta: [{ title: "ranking · casamento d & l" }] }),
  component: RankingPage,
});

type Photographer = { user_id: string; name: string; photos: number; likes: number };

function RankingPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ photos: 0, people: 0, likes: 0 });
  const [tops, setTops] = useState<Photographer[]>([]);
  const [topLiked, setTopLiked] = useState<any[]>([]);
  const [topCommented, setTopCommented] = useState<any[]>([]);
  const [active, setActive] = useState<MemoryFull | null>(null);

  useEffect(() => {
    if (!user) return;
    void load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user]);

  const load = async () => {
    const { data: mems } = await supabase
      .from("memories")
      .select("id, user_id, type, storage_path, drive_file_id, drive_view_url, drive_thumbnail_url, moment, visibility, message, created_at, profiles(name)")
      .eq("visibility", "public").eq("hidden", false);
    const memList = mems ?? [];
    const [{ data: allLikes }, { data: allComments }] = await Promise.all([
      supabase.from("likes").select("memory_id"),
      supabase.from("comments").select("memory_id"),
    ]);
    const likeCount: Record<string, number> = {};
    for (const l of allLikes ?? []) likeCount[l.memory_id] = (likeCount[l.memory_id] ?? 0) + 1;
    const commentCount: Record<string, number> = {};
    for (const c of allComments ?? []) commentCount[c.memory_id] = (commentCount[c.memory_id] ?? 0) + 1;

    const byUser: Record<string, Photographer> = {};
    for (const m of memList as any[]) {
      const name = m.profiles?.name ?? "convidado";
      byUser[m.user_id] ??= { user_id: m.user_id, name, photos: 0, likes: 0 };
      byUser[m.user_id].photos += 1;
      byUser[m.user_id].likes += likeCount[m.id] ?? 0;
    }
    const tops = Object.values(byUser).sort((a, b) => b.photos - a.photos).slice(0, 5);

    const enriched = memList.map((m: any) => ({ ...m, profile: m.profiles, likeCount: likeCount[m.id] ?? 0, commentCount: commentCount[m.id] ?? 0 }));
    const topLiked = [...enriched].sort((a, b) => b.likeCount - a.likeCount).filter(m => m.likeCount > 0).slice(0, 6);
    const topCommented = [...enriched].sort((a, b) => b.commentCount - a.commentCount).filter(m => m.commentCount > 0).slice(0, 6);

    setStats({
      photos: memList.length,
      people: Object.keys(byUser).length,
      likes: Object.values(likeCount).reduce((a, b) => a + b, 0),
    });
    setTops(tops);
    setTopLiked(topLiked);
    setTopCommented(topCommented);
  };

  if (authLoading) return <div className="p-8 text-center text-muted-foreground">carregando...</div>;
  if (!user) return (
    <div className="min-h-screen bg-watercolor"><Topbar /><div className="p-8 text-center text-muted-foreground">entre para ver o ranking · <Link to="/" className="text-rose-deep underline">login</Link></div></div>
  );

  const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const podium = tops.slice(0, 3);
  const rest = tops.slice(3);

  return (
    <div className="min-h-screen bg-cream-gradient">
      <Topbar />
      <main className="mx-auto max-w-3xl px-5 sm:px-8 pt-6 pb-24">
        <h1 className="font-serif text-4xl sm:text-5xl text-rose-deep leading-none">Ranking</h1>
        <p className="font-serif italic text-sm mt-1 mb-6" style={{ color: "#B89098" }}>
          ♡ os destaques da noite
        </p>

        <div className="grid grid-cols-3 gap-3 mb-7">
          <Stat icon="📸" label="FOTOS" value={stats.photos} />
          <Stat icon="👥" label="PESSOAS" value={stats.people} />
          <Stat icon="♡" label="CURTIDAS" value={stats.likes} />
        </div>

        <Block icon="🏆" title="Top fotógrafos">
          {tops.length === 0 ? (
            <p className="font-serif italic text-sm" style={{ color: "#B89098" }}>
              ainda sem fotos públicas.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2.5 mb-4 items-end">
                {[podium[1], podium[0], podium[2]].map((p, idx) => {
                  if (!p) return <div key={idx} />;
                  const pos = idx === 1 ? 1 : idx === 0 ? 2 : 3;
                  const styles =
                    pos === 1
                      ? { bg: "linear-gradient(180deg,#FFF3D6 0%,#FFE4A1 100%)", lift: -8, medal: "🥇" }
                      : pos === 2
                      ? { bg: "linear-gradient(180deg,#F5EDE5 0%,#E0D0C0 100%)", lift: 0, medal: "🥈" }
                      : { bg: "linear-gradient(180deg,#FDECD8 0%,#E8C29A 100%)", lift: 0, medal: "🥉" };
                  return (
                    <div
                      key={p.user_id}
                      className="rounded-2xl p-3 text-center"
                      style={{ background: styles.bg, transform: `translateY(${styles.lift}px)` }}
                    >
                      <div className="text-2xl mb-1">{styles.medal}</div>
                      <div
                        className="w-11 h-11 rounded-full bg-white text-rose-deep flex items-center justify-center mx-auto mb-2 font-serif text-base"
                        style={{ border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}
                      >
                        {initials(p.name)}
                      </div>
                      <div className="font-serif text-[13px] text-rose-deep leading-tight mb-1">
                        {p.name}
                      </div>
                      <div className="text-[10.5px] text-rose-deep/75 font-sans">
                        {p.photos} fotos · ♡ {p.likes}
                      </div>
                    </div>
                  );
                })}
              </div>
              {rest.length > 0 && (
                <div className="space-y-2">
                  {rest.map((p, i) => (
                    <div
                      key={p.user_id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                      style={{ background: "#FBEEE8" }}
                    >
                      <span className="text-[11px] font-semibold w-5" style={{ color: "#B89098" }}>
                        {i + 4}
                      </span>
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-serif text-rose-deep"
                        style={{ background: "#F8E5EC" }}
                      >
                        {initials(p.name)}
                      </span>
                      <span className="flex-1 font-serif text-[14px] text-rose-deep truncate">
                        {p.name}
                      </span>
                      <span className="text-[11px]" style={{ color: "#B89098" }}>
                        {p.photos} fotos · ♡ {p.likes}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Block>

        <Block icon="♡" title="Mais curtidas">
          {topLiked.length === 0 ? (
            <p className="font-serif italic text-sm" style={{ color: "#B89098" }}>
              ainda sem curtidas.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {topLiked.map((m, i) => (
                <button key={m.id} onClick={() => setActive(m)} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <SignedImage path={m.storage_path} driveFileId={m.drive_file_id} driveThumbnailUrl={m.drive_thumbnail_url} driveViewUrl={m.drive_view_url} type={m.type} className="w-full h-full object-cover" />
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold text-rose-deep" style={{ background: "rgba(255,255,255,.9)", backdropFilter: "blur(4px)" }}>
                    #{i + 1}
                  </span>
                  <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-full text-[10px] bg-black/55 text-white" style={{ backdropFilter: "blur(4px)" }}>
                    ♡ {m.likeCount}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Block>

        <Block icon="💬" title="Mais comentadas">
          {topCommented.length === 0 ? (
            <p className="font-serif italic text-sm" style={{ color: "#B89098" }}>
              ainda sem comentários.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {topCommented.map((m, i) => (
                <button key={m.id} onClick={() => setActive(m)} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <SignedImage path={m.storage_path} driveFileId={m.drive_file_id} driveThumbnailUrl={m.drive_thumbnail_url} driveViewUrl={m.drive_view_url} type={m.type} className="w-full h-full object-cover" />
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold text-rose-deep" style={{ background: "rgba(255,255,255,.9)", backdropFilter: "blur(4px)" }}>
                    #{i + 1}
                  </span>
                  <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-full text-[10px] bg-black/55 text-white flex items-center gap-0.5" style={{ backdropFilter: "blur(4px)" }}>
                    <MessageCircle className="w-2.5 h-2.5 fill-current" /> {m.commentCount}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Block>
      </main>
      {active && <Lightbox memory={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function Block({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div
      className="bg-card rounded-2xl p-5 sm:p-6 mb-5"
      style={{ border: "1px solid #F0DCE3", boxShadow: "0 2px 12px rgba(184,106,126,.04)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <span className="font-serif text-[22px] text-rose-deep">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div
      className="bg-card rounded-2xl px-3 py-4 text-center"
      style={{ border: "1px solid #F0DCE3", boxShadow: "0 2px 12px rgba(184,106,126,.04)" }}
    >
      <div className="text-lg mb-1">{icon}</div>
      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-1"
        style={{ color: "#C9A8B0" }}
      >
        {label}
      </div>
      <div className="font-serif text-3xl sm:text-4xl text-rose-deep leading-none">{value}</div>
    </div>
  );
}
