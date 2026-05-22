import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Heart, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Topbar } from "@/components/Topbar";
import { SignedImage } from "@/components/SignedImage";
import { Lightbox, type MemoryFull } from "@/components/Lightbox";
import { firstName } from "@/lib/media";

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

  const medal = (i: number) => i === 0 ? "var(--gold)" : i === 1 ? "var(--silver)" : i === 2 ? "var(--bronze)" : "var(--text-tertiary)";

  return (
    <div className="min-h-screen bg-watercolor">
      <Topbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="font-serif text-3xl text-rose-deep mb-5">ranking</h1>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <Stat label="FOTOS" value={stats.photos} />
          <Stat label="PESSOAS" value={stats.people} />
          <Stat label="CURTIDAS" value={stats.likes} />
        </div>

        <div className="bg-card rounded-3xl border border-border p-5 mb-5">
          <h2 className="font-serif text-xl text-rose-deep mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-caramel" /> top fotógrafos</h2>
          <ol className="space-y-2.5">
            {tops.length === 0 && <li className="text-sm text-muted-foreground">ainda sem fotos públicas.</li>}
            {tops.map((t, i) => (
              <li key={t.user_id} className="flex items-center gap-3 text-sm">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: medal(i) }}>{i + 1}</span>
                <span className="flex-1 truncate">{t.name}</span>
                <span className="text-muted-foreground text-xs">{t.photos} fotos · ♡ {t.likes}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-card rounded-3xl border border-border p-5">
          <h2 className="font-serif text-xl text-rose-deep mb-4 flex items-center gap-2"><Heart className="w-5 h-5 text-rose" /> mais curtidas</h2>
          {topLiked.length === 0 ? (
            <p className="text-sm text-muted-foreground">ainda sem curtidas.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {topLiked.map((m, i) => (
                <button key={m.id} onClick={() => setActive(m)} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                  <SignedImage path={m.storage_path} driveFileId={m.drive_file_id} driveThumbnailUrl={m.drive_thumbnail_url} driveViewUrl={m.drive_view_url} type={m.type} className="w-full h-full object-cover" />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: "var(--gold)" }}>#{i + 1}</span>
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] bg-black/60 text-white">♡ {m.likeCount}</span>
                  <span className="absolute bottom-1.5 left-1.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">{firstName(m.profile?.name ?? "")}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
      {active && <Lightbox memory={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 text-center">
      <p className="label-eyebrow text-[10px]">{label}</p>
      <p className="font-serif text-3xl text-rose-deep mt-1">{value}</p>
    </div>
  );
}
