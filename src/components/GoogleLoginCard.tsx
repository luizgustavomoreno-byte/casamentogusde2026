import { useState } from "react";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export function GoogleLoginCard() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("não foi possível entrar com o google. tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 fade-in">
      <div className="bg-card rounded-3xl shadow-soft border border-border p-7 text-center">
        <p className="label-eyebrow mb-4">para começar</p>
        <h2 className="font-serif text-2xl text-rose-deep mb-2">entre com sua conta</h2>
        <p className="text-sm text-muted-foreground mb-6">
          precisamos identificar quem mandou cada foto <span className="text-rose-light">♡</span>
        </p>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-12 rounded-full bg-rose hover:opacity-90 transition-opacity text-primary-foreground flex items-center justify-center gap-3 disabled:opacity-60"
        >
          <GoogleG />
          <span className="text-sm font-medium">
            {loading ? "carregando..." : "entrar com google"}
          </span>
        </button>
        <p className="mt-5 text-[11px] text-text-tertiary leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
          ao entrar, você concorda em compartilhar seu nome para os noivos saberem<br />
          quem mandou cada momento
        </p>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
      <path fill="#FFF" d="M22 12.2c0-.7-.06-1.4-.18-2.05H12v3.9h5.6c-.24 1.3-.97 2.4-2.07 3.13v2.6h3.36c1.96-1.8 3.1-4.48 3.1-7.58z" opacity=".95"/>
      <path fill="#FFF" d="M12 22c2.8 0 5.15-.92 6.87-2.5l-3.36-2.6c-.93.62-2.12.99-3.51.99-2.7 0-4.99-1.83-5.8-4.28H2.73v2.68A10 10 0 0 0 12 22z" opacity=".9"/>
      <path fill="#FFF" d="M6.2 13.6c-.21-.62-.32-1.28-.32-1.96s.11-1.34.32-1.96V7H2.73a10 10 0 0 0 0 9l3.47-2.4z" opacity=".85"/>
      <path fill="#FFF" d="M12 5.8c1.52 0 2.88.52 3.96 1.55l2.97-2.97C17.15 2.74 14.8 1.8 12 1.8A10 10 0 0 0 2.73 7l3.47 2.68C7 7.6 9.3 5.8 12 5.8z" opacity=".95"/>
    </svg>
  );
}
