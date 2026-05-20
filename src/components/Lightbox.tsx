import { useEffect, useState } from "react";
import { X, Heart, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SignedImage } from "./SignedImage";
import { MOMENT_LABEL, initials, firstName } from "@/lib/media";

export type MemoryFull = {
  id: string;
  user_id: string;
  type: "image" | "video";
  storage_path: string | null;
  drive_file_id?: string | null;
  drive_view_url?: string | null;
  drive_thumbnail_url?: string | null;
  moment: string;
  visibility: "public" | "private";
  message: string | null;
  created_at: string;
  profile?: { name: string; avatar_url: string | null } | null;
};

type Comment = {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  profile?: { name: string } | null;
};

export function Lightbox({ memory, onClose }: { memory: MemoryFull; onClose: () => void }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    void loadAll();
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memory.id]);

  const loadAll = async () => {
    const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
      supabase.from("likes").select("user_id").eq("memory_id", memory.id),
      supabase.from("comments").select("id, user_id, text, created_at, profiles(name)")
        .eq("memory_id", memory.id).order("created_at"),
    ]);
    setLikes(likeRows?.length ?? 0);
    setLiked(!!likeRows?.some((l) => l.user_id === user?.id));
    setComments(
      (commentRows ?? []).map((c: any) => ({
        ...c,
        profile: c.profiles,
      })),
    );
  };

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase.from("likes").delete().eq("memory_id", memory.id).eq("user_id", user.id);
      setLiked(false); setLikes((n) => Math.max(0, n - 1));
    } else {
      await supabase.from("likes").insert({ memory_id: memory.id, user_id: user.id });
      setLiked(true); setLikes((n) => n + 1);
    }
  };

  const sendComment = async () => {
    if (!user || !commentText.trim()) return;
    const text = commentText.trim().slice(0, 300);
    setCommentText("");
    await supabase.from("comments").insert({ memory_id: memory.id, user_id: user.id, text });
    void loadAll();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in" style={{ background: "rgba(42,31,24,0.94)" }}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
        <X className="w-5 h-5" />
      </button>
      <div className="w-full max-w-2xl max-h-full overflow-y-auto text-white">
        <div className="flex justify-center mb-4">
          <SignedImage
            path={memory.storage_path}
            driveFileId={memory.drive_file_id}
            driveThumbnailUrl={memory.drive_thumbnail_url}
            driveViewUrl={memory.drive_view_url}
            type={memory.type}
            full
            className="max-h-[50vh] w-auto rounded-2xl object-contain"
          />
        </div>
        <div className="text-center px-4">
          <p className="font-serif text-xl">{memory.profile?.name ?? "convidado"}</p>
          {memory.message && <p className="italic text-sm text-white/80 mt-1">"{memory.message}"</p>}
          <div className="flex justify-center gap-2 mt-2 text-[11px]">
            <span className="px-2 py-1 rounded-full bg-white/10">{MOMENT_LABEL[memory.moment]}</span>
            {memory.visibility === "private" && (
              <span className="px-2 py-1 rounded-full bg-rose/80">🔒 privada</span>
            )}
          </div>
          <button
            onClick={toggleLike}
            disabled={!user}
            className={`mt-4 px-5 h-10 rounded-full text-sm font-medium inline-flex items-center gap-2 transition ${
              liked ? "bg-rose text-primary-foreground" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} /> {liked ? "curtido" : "curtir"} · {likes}
          </button>
        </div>

        <div className="mt-6 px-4">
          {comments.length > 0 && (
            <p className="text-[11px] uppercase tracking-widest text-white/50 mb-2">
              {comments.length} comentário{comments.length > 1 ? "s" : ""}
            </p>
          )}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2 text-sm">
                <span className="w-7 h-7 shrink-0 rounded-full bg-rose flex items-center justify-center text-[10px] font-medium">
                  {initials(c.profile?.name ?? "?")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="leading-snug">
                    <span className="font-medium">{firstName(c.profile?.name ?? "?")}</span>
                    <span className="text-white/80 ml-2 break-words">{c.text}</span>
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    {new Date(c.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            {comments.length === 0 && <p className="text-xs text-white/50 text-center py-2">seja a primeira pessoa a comentar</p>}
          </div>
        </div>

        {user && (
          <div className="mt-4 px-4 pb-4 flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendComment()}
              placeholder="deixe um comentário..."
              maxLength={300}
              className="flex-1 h-10 px-4 rounded-full bg-white/10 placeholder:text-white/40 text-sm focus:outline-none focus:bg-white/15"
            />
            <button onClick={sendComment} className="h-10 w-10 rounded-full bg-rose flex items-center justify-center">
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
