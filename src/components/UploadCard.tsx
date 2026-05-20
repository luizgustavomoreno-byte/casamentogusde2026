import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import imageCompression from "browser-image-compression";
import { Camera, Image as ImageIcon, Globe, Lock, Check, X as XIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Moment = "ceremonia" | "festa" | "pista";
type Visibility = "public" | "private";

type QueueItem = {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
};

const MAX_SIZE = 100 * 1024 * 1024; // 100MB — cabe vídeos curtos

export function UploadCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [moment, setMoment] = useState<Moment>("ceremonia");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const items: QueueItem[] = Array.from(files)
      .filter((f) => {
        if (f.size > MAX_SIZE) {
          toast.error(`${f.name}: ultrapassa 100MB`);
          return false;
        }
        return true;
      })
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "queued",
      }));
    setQueue((q) => [...q, ...items]);
    items.forEach((it) => uploadOne(it));
  };

  const uploadOne = async (item: QueueItem, retry = 0) => {
    setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, status: "uploading", progress: 10 } : i)));
    try {
      let file: Blob = item.file;
      const isVideo = item.file.type.startsWith("video/");
      if (!isVideo) {
        file = await imageCompression(item.file, {
          maxSizeMB: 2.5,
          maxWidthOrHeight: 1400,
          useWebWorker: true,
          fileType: "image/jpeg",
          initialQuality: 0.8,
        });
      }
      setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, progress: 40 } : i)));

      const ext = isVideo ? (item.file.name.split(".").pop() || "mp4") : "jpg";
      const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("memories")
        .upload(path, file, {
          contentType: isVideo ? item.file.type : "image/jpeg",
          upsert: false,
        });
      if (upErr) throw upErr;

      setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, progress: 80 } : i)));

      const { error: insErr } = await supabase.from("memories").insert({
        user_id: user.id,
        type: isVideo ? "video" : "image",
        storage_path: path,
        mime_type: isVideo ? item.file.type : "image/jpeg",
        size_bytes: (file as Blob).size,
        moment,
        visibility,
        message: message.trim() || null,
      });
      if (insErr) throw insErr;

      setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, progress: 100, status: "done" } : i)));
    } catch (e) {
      console.error(e);
      if (retry < 2) {
        setTimeout(() => uploadOne(item, retry + 1), 800);
        return;
      }
      setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, status: "error" } : i)));
    }
  };

  // Redirect when all done
  if (queue.length > 0 && queue.every((i) => i.status === "done")) {
    setTimeout(() => navigate({ to: "/obrigado" }), 800);
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-12">
      <div className="bg-card rounded-3xl shadow-soft border border-border p-5 sm:p-6 fade-in">
        <p className="label-eyebrow mb-3">enviar momento</p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 200))}
          placeholder="deixe um recadinho pros noivos (opcional)"
          rows={2}
          className="w-full px-4 py-3 rounded-2xl bg-muted border-0 text-sm placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-rose-light"
        />

        <div className="mt-5">
          <p className="text-xs text-muted-foreground mb-2">qual momento?</p>
          <div className="grid grid-cols-3 gap-2">
            {(["ceremonia", "festa", "pista"] as Moment[]).map((m) => (
              <button
                key={m}
                onClick={() => setMoment(m)}
                className={`px-2 py-3 rounded-2xl text-xs font-medium border transition-all ${
                  moment === m
                    ? "bg-rose-bg text-rose-deep border-rose-light"
                    : "bg-card text-muted-foreground border-border hover:border-rose-light/60"
                }`}
              >
                {m === "ceremonia" && "⛪ cerimônia"}
                {m === "festa" && "🥂 festa"}
                {m === "pista" && "💃 pista"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">visibilidade</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setVisibility("public")}
              className={`p-3 rounded-2xl text-left border transition-all ${
                visibility === "public"
                  ? "bg-rose-bg border-rose-light text-rose-deep"
                  : "bg-card border-border text-muted-foreground hover:border-rose-light/60"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium"><Globe className="w-4 h-4" /> pública</div>
              <p className="text-[11px] mt-0.5 opacity-80">todos veem e baixam</p>
            </button>
            <button
              onClick={() => setVisibility("private")}
              className={`p-3 rounded-2xl text-left border transition-all ${
                visibility === "private"
                  ? "bg-rose-bg border-rose-light text-rose-deep"
                  : "bg-card border-border text-muted-foreground hover:border-rose-light/60"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium"><Lock className="w-4 h-4" /> privada</div>
              <p className="text-[11px] mt-0.5 opacity-80">só você e os noivos</p>
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className="h-12 rounded-full bg-rose text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Camera className="w-4 h-4" /> tirar foto
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className="h-12 rounded-full border-2 border-caramel text-caramel-text text-sm font-medium flex items-center justify-center gap-2 hover:bg-caramel/10 transition-colors"
          >
            <ImageIcon className="w-4 h-4" /> da galeria
          </button>
        </div>

        {/* capture="environment" abre direto a câmera traseira no celular */}
        <input ref={cameraRef} type="file" accept="image/*,video/*" capture="environment" hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
        <input ref={galleryRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />

        {queue.length > 0 && (
          <div className="mt-5 space-y-2">
            {queue.map((it) => (
              <div key={it.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted">
                <img src={it.preview} alt="" className="w-9 h-9 rounded-lg object-cover bg-card" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{it.file.name}</p>
                  <div className="mt-1 h-1 bg-card rounded-full overflow-hidden">
                    <div className="h-full bg-rose transition-all" style={{ width: `${it.progress}%` }} />
                  </div>
                </div>
                <span className="text-xs shrink-0">
                  {it.status === "done" && (
                    <span className={visibility === "private" ? "text-rose-deep" : "text-success"}>
                      {visibility === "private" ? "🔒 enviado" : <><Check className="w-4 h-4 inline" /> enviado</>}
                    </span>
                  )}
                  {it.status === "error" && <span className="text-destructive"><XIcon className="w-4 h-4 inline" /> falhou</span>}
                  {it.status === "uploading" && <span className="text-muted-foreground">{it.progress}%</span>}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-[11px] text-center text-text-tertiary" style={{ color: "var(--text-tertiary)" }}>
          envie quantas quiser · fotos e vídeos até 100MB (≈1 min em HD)
        </p>
      </div>
    </div>
  );
}
