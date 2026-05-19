import { useEffect, useState } from "react";
import { signedUrl } from "@/lib/media";

export function SignedImage({
  path,
  type = "image",
  className,
  alt = "",
}: {
  path: string;
  type?: "image" | "video";
  className?: string;
  alt?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    signedUrl(path).then((u) => alive && setUrl(u)).catch(() => alive && setUrl(null));
    return () => { alive = false; };
  }, [path]);

  if (!url) return <div className={`bg-muted animate-pulse ${className ?? ""}`} />;
  if (type === "video") {
    return <video src={url} className={className} controls playsInline />;
  }
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
