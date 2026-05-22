import { Heart, Play, Lock, MessageCircle } from "lucide-react";
import { SignedImage } from "./SignedImage";
import { MOMENT_LABEL, firstName } from "@/lib/media";

export type MemoryItem = {
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
  likeCount?: number;
  commentCount?: number;
  profile?: { name: string } | null;
};

export function MemoryCard({
  m,
  showPrivateBadge,
  onClick,
}: {
  m: MemoryItem;
  showPrivateBadge: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
    >
      <SignedImage
        path={m.storage_path}
        driveFileId={m.drive_file_id}
        driveThumbnailUrl={m.drive_thumbnail_url}
        driveViewUrl={m.drive_view_url}
        type="image"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-[var(--bg-cream)]/85 text-text-primary">
        {MOMENT_LABEL[m.moment]}
      </span>
      {showPrivateBadge && m.visibility === "private" && (
        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-rose text-primary-foreground flex items-center gap-0.5">
          <Lock className="w-2.5 h-2.5" /> privada
        </span>
      )}
      {m.type === "video" && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Play className="w-8 h-8 text-white drop-shadow-lg fill-white/40" />
        </span>
      )}
      {((m.likeCount ?? 0) > 0 || (m.commentCount ?? 0) > 0) && (
        <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
          {(m.likeCount ?? 0) > 0 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/55 text-white flex items-center gap-0.5">
              <Heart className="w-2.5 h-2.5 fill-current" /> {m.likeCount}
            </span>
          )}
          {(m.commentCount ?? 0) > 0 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/55 text-white flex items-center gap-0.5">
              <MessageCircle className="w-2.5 h-2.5 fill-current" /> {m.commentCount}
            </span>
          )}
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 px-2 py-1 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-left">
        {firstName(m.profile?.name ?? "")}
      </span>
    </button>
  );
}
