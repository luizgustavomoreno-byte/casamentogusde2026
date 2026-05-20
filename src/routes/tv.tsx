import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SignedImage } from "@/components/SignedImage";
import { MOMENT_LABEL } from "@/lib/media";

export const Route = createFileRoute("/tv")({
  head: () => ({ meta: [{ title: "modo tv · casamento lg & dc" }] }),
  component: TVPage,
});

function TVPage() {
  const [items, setItems] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    void load();
    const channel = supabase.channel("tv")
      .on("postgres_changes", { event: "*", schema: "public", table: "memories" }, () => load())
      .subscribe();
    const t = setInterval(load, 30000);
    return () => { void supabase.removeChannel(channel); clearInterval(t); };
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  const load = async () => {
    const { data } = await supabase
      .from("memories")
      .select("id, type, storage_path, drive_file_id, drive_view_url, drive_thumbnail_url, moment, message, profiles(name)")
      .eq("visibility", "public").eq("hidden", false)
      .order("created_at", { ascending: false }).limit(80);
    setItems((data ?? []).map((m: any) => ({ ...m, profile: m.profiles })));
  };

  const cur = items[idx];
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white relative" style={{ backgroundColor: "var(--bg-dark)" }}>
      <Link
        to="/"
        className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs uppercase tracking-widest text-white transition-colors shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" /> voltar
      </Link>
      <div className="absolute top-6 right-6 flex items-center gap-2 text-xs uppercase tracking-widest">
        <span className="w-2.5 h-2.5 rounded-full bg-rose pulse-dot" /> ao vivo
      </div>
      {!cur ? (
        <p className="text-white/60 text-sm">aguardando os primeiros momentos...</p>
      ) : (
        <div key={cur.id} className="text-center px-6 fade-in">
          <div className="flex justify-center mb-6">
            <SignedImage path={cur.storage_path} driveFileId={cur.drive_file_id} driveThumbnailUrl={cur.drive_thumbnail_url} driveViewUrl={cur.drive_view_url} type={cur.type} full className="max-h-[60vh] rounded-2xl shadow-elegant" />
          </div>
          <p className="font-serif text-4xl">{cur.profile?.name ?? "convidado"}</p>
          {cur.message && <p className="italic text-white/70 mt-2">"{cur.message}"</p>}
          <p className="mt-3 text-xs uppercase tracking-widest text-white/50">{MOMENT_LABEL[cur.moment]}</p>
        </div>
      )}
      <p className="absolute bottom-6 text-[11px] text-white/40 tracking-wide">só públicas · privadas nunca aparecem aqui</p>
    </div>
  );
}
