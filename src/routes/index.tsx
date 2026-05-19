import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/Topbar";
import { Hero } from "@/components/Hero";
import { GoogleLoginCard } from "@/components/GoogleLoginCard";
import { UploadCard } from "@/components/UploadCard";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const { user, loading } = useAuth();
  return (
    <div className="min-h-screen bg-watercolor">
      <Topbar />
      <main className="pb-16">
        <Hero />
        {loading ? (
          <div className="text-center text-sm text-muted-foreground">carregando...</div>
        ) : user ? (
          <UploadCard />
        ) : (
          <GoogleLoginCard />
        )}
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="pb-8 text-center">
      <p className="label-eyebrow">feito com amor · lg &amp; dc</p>
    </footer>
  );
}
