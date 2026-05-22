import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Topbar } from "@/components/Topbar";
import { MemoryCard, type MemoryItem } from "@/components/MemoryCard";
import { Lightbox, type MemoryFull } from "@/components/Lightbox";
import { signedUrl } from "@/lib/media";
import { toast } from "sonner";

export const Route = createFileRoute("/galeria")({
  head: () => ({ meta: [{ title: "galeria · casamento d & l" }] }),
  component: GaleriaPage,
});

type MomentFilter = "all" | "ceremonia" | "festa" | "pista";
type VisFilter = "all" | "mine" | "minePrivate";

function GaleriaPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<(MemoryItem & { created_at: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [moment, setMoment] = useState<MomentFilter>("all");
  const [vis, setVis] = useState<VisFilter>("all");
  const [active, setActive] = useState<MemoryFull | null>(null);

  useEffect(() => {
    if (!user) return;
    void load();
    const channel = supabase.channel("gallery")
      .on("postgres_changes", { event: "*", schema: "public", table: "memories" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const load = async () => {
    const { data: mems } = await supabase
      .from("memories")
      .select("id, user_id, type, storage_path, drive_file_id, drive_view_url, drive_thumbnail_url, moment, visibility, message, created_at, profiles(name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(500);
    const ids = (mems ?? []).map((m: any) => m.id);
    let likeMap: Record<string, number> = {};
    let commentMap: Record<string, number> = {};
    if (ids.length) {
      const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
        supabase.from("likes").select("memory_id").in("memory_id", ids),
        supabase.from("comments").select("memory_id").in("memory_id", ids),
      ]);
      for (const l of likeRows ?? []) likeMap[l.memory_id] = (likeMap[l.memory_id] ?? 0) + 1;
      for (const c of commentRows ?? []) commentMap[c.memory_id] = (commentMap[c.memory_id] ?? 0) + 1;
    }
    setItems((mems ?? []).map((m: any) => ({ ...m, profile: m.profiles, likeCount: likeMap[m.id] ?? 0, commentCount: commentMap[m.id] ?? 0 })));
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (moment !== "all" && m.moment !== moment) return false;
      if (vis === "mine" && m.user_id !== user?.id) return false;
      if (vis === "minePrivate" && !(m.user_id === user?.id && m.visibility === "private")) return false;
      return true;
    });
  }, [items, moment, vis, user?.id]);

  const stats = useMemo(() => {
    const pub = items.filter((m) => m.visibility === "public");
    const people = new Set(pub.map((m) => m.user_id)).size;
    return { count: pub.length, people };
  }, [items]);

  const downloadAll = async () => {
    toast.info(`preparando ${filtered.length} arquivos...`);
    const zip = new JSZip();
    for (const m of filtered as any[]) {
      try {
        let url: string | null = null;
        let ext = "jpg";
        if (m.drive_file_id) {
          // baixar do Drive em qualidade alta
          url = m.type === "video"
            ? `https://drive.google.com/uc?export=download&id=${m.drive_file_id}`
            : `https://drive.google.com/thumbnail?id=${m.drive_file_id}&sz=w2400`;
          ext = m.type === "video" ? "mp4" : "jpg";
        } else if (m.storage_path) {
          url = await signedUrl(m.storage_path);
          ext = m.storage_path.split(".").pop() ?? "jpg";
        }
        if (!url) continue;
        const blob = await (await fetch(url)).blob();
        zip.file(`${m.moment}/${m.id}.${ext}`, blob);
      } catch (e) { console.error(e); }
    }
    const out = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(out);
    a.download = `casamento-d-l-${Date.now()}.zip`;
    a.click();
  };

  if (authLoading) return <div className="p-8 text-center text-muted-foreground">carregando...</div>;
  if (!user) return (
    <div className="min-h-screen bg-watercolor">
      <Topbar />
      <div className="p-8 text-center">
        <p className="text-muted-foreground">entre para ver a galeria</p>
        <Link to="/" className="mt-4 inline-block rounded-full bg-rose text-primary-foreground px-5 py-2.5 text-sm">ir pro login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-watercolor">
      <Topbar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="font-serif text-3xl text-rose-deep">galeria</h1>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-rose-light">♡</span> {stats.count} momentos públicos por {stats.people} pessoas
            </p>
          </div>
          <button onClick={downloadAll} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-sm hover:border-rose-light transition-colors">
            <Download className="w-4 h-4" /> baixar tudo
          </button>
        </div>

        <div className="space-y-2 mb-5">
          <Pills value={moment} onChange={(v) => setMoment(v as MomentFilter)} options={[
            { v: "all", l: "tudo" }, { v: "ceremonia", l: "⛪ cerimônia" }, { v: "festa", l: "🥂 festa" }, { v: "pista", l: "💃 pista" },
          ]} />
          <Pills value={vis} onChange={(v) => setVis(v as VisFilter)} options={[
            { v: "all", l: "todas" }, { v: "mine", l: "só minhas" }, { v: "minePrivate", l: "🔒 minhas privadas" },
          ]} />
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">carregando momentos...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">nenhuma foto ainda. seja o primeiro!</div>
        ) : (
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
            {filtered.map((m) => (
              <MemoryCard
                key={m.id}
                m={m}
                showPrivateBadge={m.user_id === user.id}
                onClick={() => setActive(m as unknown as MemoryFull)}
              />
            ))}
          </div>
        )}
      </main>
      {active && <Lightbox memory={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function Pills<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
            value === o.v ? "bg-rose-bg border-rose-light text-rose-deep" : "bg-card border-border text-muted-foreground hover:border-rose-light/60"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
