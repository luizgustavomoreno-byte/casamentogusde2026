import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import imageCompression from "browser-image-compression";
import { Camera, Image as ImageIcon, Globe, Lock, Check, X as XIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { uploadToDrive } from "@/lib/drive.functions";
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

const MAX_SIZE = 200 * 1024 * 1024; // 200MB — vídeos curtos vão direto pro seu Drive

export function UploadCard() {
  const upload = useServerFn(uploadToDrive);
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
          toast.error(`${f.name}: ultrapassa 200MB`);
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
      const isVideo = item.file.type.startsWith("video/");
      let outFile: File = item.file;
      let outMime = item.file.type || "application/octet-stream";

      if (!isVideo) {
        // compressão forte mantendo qualidade visual:
        // 1ª passada: redimensiona para 1920px e mira ~1.2MB
        // se ainda passar de 1.5MB, 2ª passada mais agressiva
        let compressed: Blob = await imageCompression(item.file, {
          maxSizeMB: 1.2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/jpeg",
          initialQuality: 0.82,
        });
        if (compressed.size > 1.5 * 1024 * 1024) {
          compressed = await imageCompression(compressed as File, {
            maxSizeMB: 0.9,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
            fileType: "image/jpeg",
            initialQuality: 0.72,
          });
        }
        outMime = "image/jpeg";
        const baseName = item.file.name.replace(/\.[^.]+$/, "") || "foto";
        outFile = new File([compressed], `${baseName}.jpg`, { type: "image/jpeg" });
      }

      setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, progress: 40 } : i)));

      const form = new FormData();
      form.append("file", outFile);
      form.append("type", isVideo ? "video" : "image");
      form.append("moment", moment);
      form.append("visibility", visibility);
      form.append("mimeType", outMime);
      if (message.trim()) form.append("message", message.trim().slice(0, 200));

      setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, progress: 60 } : i)));

      const res = await upload({ data: form });
      if (!res?.ok) throw new Error("upload sem confirmação");

      setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, progress: 100, status: "done" } : i)));
    } catch (e) {
      console.error(e);
      if (retry < 2) {
        setTimeout(() => uploadOne(item, retry + 1), 1200);
        return;
      }
      toast.error(`falha ao enviar ${item.file.name}`);
      setQueue((q) => q.map((i) => (i.id === item.id ? { ...i, status: "error" } : i)));
    }
  };


  // Redirect when all done
  if (queue.length > 0 && queue.every((i) => i.status === "done")) {
    setTimeout(() => navigate({ to: "/obrigado" }), 800);
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-12">
      <div
        className="bg-card rounded-3xl border p-6 sm:p-7 fade-in"
        style={{ borderColor: "#F0DCE3", boxShadow: "0 4px 24px rgba(184,106,126,.06)" }}
      >
        <p className="font-sans text-[10px] tracking-[0.3em] text-[var(--text-tertiary)] uppercase text-center mb-5">
          ENVIAR MOMENTO
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 200))}
          placeholder="deixe um recadinho pros noivos (opcional)"
          rows={2}
          className="w-full px-4 py-3.5 rounded-2xl border-0 font-serif italic text-sm text-rose-deep placeholder:text-[#B89098] resize-none focus:outline-none focus:ring-2 focus:ring-rose-light mb-5"
          style={{ background: "#FBEEE8", height: 58 }}
        />

        <p className="font-serif italic text-[13px] text-[var(--text-tertiary)] mb-2.5 pl-1">
          qual momento?
        </p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {(["ceremonia", "festa", "pista"] as Moment[]).map((m) => {
            const on = moment === m;
            return (
              <button
                key={m}
                onClick={() => setMoment(m)}
                className={`py-2.5 rounded-full font-serif text-[13px] border transition-all ${
                  on
                    ? "bg-rose-bg text-rose-deep"
                    : "bg-card text-rose-deep hover:border-rose-light/60"
                }`}
                style={{
                  borderColor: on ? "#D4798F" : "#EAD4D9",
                  borderWidth: on ? 1.5 : 1,
                }}
              >
                {m === "ceremonia" && "🏠 cerimônia"}
                {m === "festa" && "🥂 festa"}
                {m === "pista" && "💃 pista"}
              </button>
            );
          })}
        </div>

        <p className="font-serif italic text-[13px] text-[var(--text-tertiary)] mb-2.5 pl-1">
          visibilidade
        </p>
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {(
            [
              { v: "public", t: "🌐 Pública", s: "todos veem e baixam" },
              { v: "private", t: "🔒 Privada", s: "só você e os noivos" },
            ] as { v: Visibility; t: string; s: string }[]
          ).map((opt) => {
            const on = visibility === opt.v;
            return (
              <button
                key={opt.v}
                onClick={() => setVisibility(opt.v)}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  on ? "bg-rose-bg" : "bg-card hover:border-rose-light/60"
                }`}
                style={{
                  borderColor: on ? "#D4798F" : "#EAD4D9",
                  borderWidth: on ? 1.5 : 1,
                }}
              >
                <div className="font-serif text-[15px] text-rose-deep">{opt.t}</div>
                <p className="text-[10.5px] mt-0.5 text-[var(--text-tertiary)]">{opt.s}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button
            onClick={() => cameraRef.current?.click()}
            className="h-12 rounded-full text-white font-serif text-[15px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #C77890 0%, #B86A7E 100%)",
              boxShadow: "0 4px 14px rgba(184,106,126,.25)",
            }}
          >
            <Camera className="w-4 h-4" /> tirar foto
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className="h-12 rounded-full bg-card font-serif text-[15px] text-rose-deep flex items-center justify-center gap-2 hover:bg-rose-bg/40 transition-colors"
            style={{ border: "1.5px solid #D4798F" }}
          >
            <ImageIcon className="w-4 h-4" /> da galeria
          </button>
        </div>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
        <input ref={galleryRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />

        {queue.length > 0 && (
          <div className="mt-3 space-y-2">
            {queue.map((it) => (
              <div key={it.id} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: "#FBEEE8" }}>
                <img src={it.preview} alt="" className="w-9 h-9 rounded-lg object-cover bg-card" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate text-rose-deep">{it.file.name}</p>
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

        <p className="mt-4 font-serif italic text-[12px] text-center text-[var(--text-tertiary)]">
          envie quantas quiser · até 200MB por vez
        </p>
      </div>
    </div>
  );
}
