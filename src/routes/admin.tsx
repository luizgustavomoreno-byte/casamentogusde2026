import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import JSZip from "jszip";
import { Eye, EyeOff, Download, Trash2, Lock, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUploadsEnabled } from "@/hooks/useUploadsEnabled";
import { Topbar } from "@/components/Topbar";
import { SignedImage } from "@/components/SignedImage";
import { signedUrl, MOMENT_LABEL, firstName } from "@/lib/media";
import { toast } from "sonner";


export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "admin · casamento d & l" }] }),
  component: AdminPage,
});

type Filter = "all" | "public" | "private" | "hidden" | "flagged";

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const { enabled: uploadsEnabled, refresh: refreshUploads } = useUploadsEnabled();

  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [likeMap, setLikeMap] = useState<Record<string, number>>({});

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin]);

  const load = async () => {
    const { data } = await supabase
      .from("memories")
      .select("id, user_id, type, storage_path, drive_file_id, drive_view_url, drive_thumbnail_url, mime_type, moment, visibility, message, hidden, flagged, created_at, profiles(name)")
      .order("created_at", { ascending: false }).limit(2000);
    setItems((data ?? []).map((m: any) => ({ ...m, profile: m.profiles })));
    const ids = (data ?? []).map((m: any) => m.id);
    if (ids.length) {
      const { data: likes } = await supabase.from("likes").select("memory_id").in("memory_id", ids);
      const map: Record<string, number> = {};
      for (const l of likes ?? []) map[l.memory_id] = (map[l.memory_id] ?? 0) + 1;
      setLikeMap(map);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">carregando...</div>;
  if (!user) return <div className="p-8 text-center"><Link to="/" className="text-rose-deep">faça login</Link></div>;
  if (!isAdmin) return (
    <div className="min-h-screen bg-watercolor"><Topbar /><div className="p-12 text-center text-muted-foreground">você não tem acesso a esta área.</div></div>
  );

  const stats = {
    total: items.length,
    pub: items.filter((m) => m.visibility === "public").length,
    priv: items.filter((m) => m.visibility === "private").length,
    people: new Set(items.map((m) => m.user_id)).size,
  };

  const filtered = items.filter((m) => {
    if (filter === "public") return m.visibility === "public" && !m.hidden;
    if (filter === "private") return m.visibility === "private";
    if (filter === "hidden") return m.hidden;
    if (filter === "flagged") return m.flagged;
    return true;
  });

  const toggleHide = async (m: any) => {
    await supabase.from("memories").update({ hidden: !m.hidden }).eq("id", m.id);
    void load();
  };

  const exportAll = async () => {
    toast.info(`exportando ${items.length} arquivos...`);
    const zip = new JSZip();
    for (const m of items as any[]) {
      try {
        let url: string | null = null;
        let ext = "jpg";
        if (m.drive_file_id) {
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
        const folder = m.visibility === "private" ? `privadas/${m.moment}` : m.moment;
        zip.file(`${folder}/${m.id}.${ext}`, blob);
      } catch (e) { console.error(e); }
    }
    const out = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(out);
    a.download = `casamento-d-l-completo-${Date.now()}.zip`;
    a.click();
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const selectAllFiltered = () => {
    setSelected((s) => {
      const n = new Set(s);
      const allSelected = filtered.every((m) => n.has(m.id));
      if (allSelected) filtered.forEach((m) => n.delete(m.id));
      else filtered.forEach((m) => n.add(m.id));
      return n;
    });
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`apagar ${selected.size} foto(s) do app? os arquivos continuam salvos no Google Drive como backup.`)) return;
    const ids = Array.from(selected);
    const rows = items.filter((m) => selected.has(m.id));
    const paths = rows.map((m) => m.storage_path).filter(Boolean) as string[];
    // legado: só removemos do Supabase Storage. Arquivos do Drive permanecem como backup permanente.
    if (paths.length) await supabase.storage.from("memories").remove(paths);
    const { error } = await supabase.from("memories").delete().in("id", ids);
    if (error) { toast.error("erro ao apagar: " + error.message); return; }
    toast.success(`${ids.length} foto(s) removida(s) do app. backup mantido no Drive.`);
    setSelected(new Set());
    void load();
  };

  return (
    <div className="min-h-screen bg-watercolor">
      <Topbar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="font-serif text-3xl text-rose-deep mb-5">admin</h1>

        <UploadsToggle enabled={uploadsEnabled} onChanged={refreshUploads} />



        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          <Stat label="TOTAL" value={stats.total} />
          <Stat label="PÚBLICAS" value={stats.pub} />
          <Stat label="PRIVADAS" value={stats.priv} />
          <Stat label="PESSOAS" value={stats.people} />
        </div>

        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <button onClick={exportAll} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose text-primary-foreground text-sm">
            <Download className="w-4 h-4" /> exportar tudo
          </button>
          <button onClick={selectAllFiltered} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm hover:border-rose-light">
            selecionar tudo do filtro
          </button>
          <button
            onClick={deleteSelected}
            disabled={selected.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-destructive text-destructive text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" /> apagar selecionadas ({selected.size})
          </button>
        </div>

        <div className="flex gap-1.5 flex-wrap mb-4">
          {(["all", "public", "private", "hidden", "flagged"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs border ${filter === f ? "bg-rose-bg border-rose-light text-rose-deep" : "bg-card border-border text-muted-foreground"}`}>
              {f === "all" ? "todos" : f === "public" ? "públicas" : f === "private" ? "privadas" : f === "hidden" ? "ocultas" : "denunciadas"}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {filtered.map((m) => (
            <div key={m.id} className={`flex items-center gap-3 p-3 ${selected.has(m.id) ? "bg-rose-bg/40" : ""}`}>
              <input
                type="checkbox"
                checked={selected.has(m.id)}
                onChange={() => toggleSelect(m.id)}
                className="w-4 h-4 shrink-0 accent-rose-deep cursor-pointer"
              />
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted cursor-pointer" onClick={() => toggleSelect(m.id)}>
                <SignedImage path={m.storage_path} driveFileId={m.drive_file_id} driveThumbnailUrl={m.drive_thumbnail_url} driveViewUrl={m.drive_view_url} type={m.type} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{firstName(m.profile?.name ?? "")}</p>
                {m.message && <p className="text-xs italic text-muted-foreground truncate">"{m.message}"</p>}
                <p className="text-[11px] text-muted-foreground">
                  {new Date(m.created_at).toLocaleString("pt-BR")} · {MOMENT_LABEL[m.moment]} ·
                  {m.visibility === "private" ? " 🔒 privada" : " 🌐 pública"}
                  {m.hidden && " · 🚫 oculta"}
                  {m.flagged && " · ⚠ denunciada"}
                  {" · ♡ "}{likeMap[m.id] ?? 0}
                </p>
              </div>
              <button onClick={() => toggleHide(m)} className="shrink-0 px-3 py-1.5 rounded-full text-xs border border-border hover:border-rose-light flex items-center gap-1">
                {m.hidden ? <><Eye className="w-3 h-3" /> mostrar</> : <><EyeOff className="w-3 h-3" /> ocultar</>}
              </button>
            </div>
          ))}
          {filtered.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">nenhuma foto neste filtro.</div>}
        </div>

        <div className="mt-8 bg-card rounded-3xl border border-border p-6 text-center">
          <h2 className="font-serif text-xl text-rose-deep mb-3">qr code do app</h2>
          <p className="text-xs text-muted-foreground mb-4">imprima e espalhe pelas mesas</p>
          <div className="inline-block bg-white p-4 rounded-2xl">
            <QRCodeCanvas value={typeof window !== "undefined" ? window.location.origin : ""} size={220} fgColor="#8B3F5E" />
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3 text-center">
      <p className="label-eyebrow text-[10px]">{label}</p>
      <p className="font-serif text-2xl text-rose-deep mt-0.5">{value}</p>
    </div>
  );
}

function UploadsToggle({ enabled, onChanged }: { enabled: boolean | null; onChanged: () => void }) {
  const [saving, setSaving] = useState(false);
  if (enabled === null) return null;

  const toggle = async () => {
    const next = !enabled;
    const label = next ? "reabrir os envios para todos?" : "encerrar os envios? ninguém mais conseguirá enviar fotos ou vídeos (mas o álbum continua acessível).";
    if (!confirm(label)) return;
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "uploads_enabled", value: next, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) { toast.error("erro: " + error.message); return; }
    toast.success(next ? "envios reabertos ✨" : "envios encerrados 💕");
    onChanged();
  };

  return (
    <div className="mb-5 bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${enabled ? "bg-rose-bg text-rose-deep" : "bg-muted text-muted-foreground"}`}>
        {enabled ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-serif text-[15px] text-rose-deep">
          envios {enabled ? "abertos" : "encerrados"}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {enabled
            ? "convidados podem enviar fotos e vídeos normalmente."
            : "ninguém envia mais — o álbum segue acessível pra todos visitarem."}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-colors disabled:opacity-50 ${
          enabled
            ? "border-destructive text-destructive hover:bg-destructive/10"
            : "border-rose-deep text-rose-deep hover:bg-rose-bg"
        }`}
      >
        {enabled ? "encerrar envios" : "reabrir envios"}
      </button>
    </div>
  );
}

