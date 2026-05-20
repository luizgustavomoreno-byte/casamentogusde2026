import { useEffect, useState } from "react";
import { signedUrl } from "@/lib/media";

type Props = {
  path?: string | null;
  driveFileId?: string | null;
  driveThumbnailUrl?: string | null;
  driveViewUrl?: string | null;
  type?: "image" | "video";
  className?: string;
  alt?: string;
  full?: boolean;
};

export function SignedImage({
  path,
  driveFileId,
  driveThumbnailUrl,
  driveViewUrl,
  type = "image",
  className,
  alt = "",
  full = false,
}: Props) {
  // Prefer Google Drive when present
  if (driveFileId || driveViewUrl || driveThumbnailUrl) {
    if (type === "video") {
      if (full) {
        const src = driveViewUrl ?? `https://drive.google.com/file/d/${driveFileId}/preview`;
        return (
          <iframe
            src={src}
            className={className}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={alt || "vídeo"}
          />
        );
      }
      // grid/thumbnail: show poster
      const src =
        driveThumbnailUrl ??
        (driveFileId ? `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w400` : "");
      return <img src={src} alt={alt} className={className} loading="lazy" />;
    }
    const src = full
      ? driveViewUrl ??
        (driveFileId ? `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1600` : "")
      : driveThumbnailUrl ??
        (driveFileId ? `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w400` : "");
    return <img src={src} alt={alt} className={className} loading="lazy" />;
  }

  // Legacy Supabase storage fallback
  return <LegacySigned path={path ?? ""} type={type} className={className} alt={alt} />;
}

function LegacySigned({
  path,
  type,
  className,
  alt,
}: {
  path: string;
  type: "image" | "video";
  className?: string;
  alt?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let alive = true;
    signedUrl(path).then((u) => alive && setUrl(u)).catch(() => alive && setUrl(null));
    return () => { alive = false; };
  }, [path]);

  if (!path) return <div className={`bg-muted ${className ?? ""}`} />;
  if (!url) return <div className={`bg-muted animate-pulse ${className ?? ""}`} />;
  if (type === "video") {
    return <video src={url} className={className} controls playsInline />;
  }
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
