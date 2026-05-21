import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-watercolor px-4">
      <div className="max-w-md text-center">
        <p className="label-eyebrow mb-3">página não encontrada</p>
        <h1 className="font-serif text-5xl text-rose-deep">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">essa página não existe.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-full bg-rose px-5 py-2.5 text-sm text-primary-foreground">
          voltar pro início
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-watercolor px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-xl text-rose-deep">algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-5 rounded-full bg-rose px-5 py-2.5 text-sm text-primary-foreground">
          tentar novamente
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#FBF6EE" },
      { title: "Casamento D & L · 30·05·2026" },
      { name: "description", content: "Compartilhe as fotos e vídeos do casamento de Débora & Luiz Gustavo." },
      { property: "og:title", content: "Casamento D & L · 30·05·2026" },
      { property: "og:description", content: "Compartilhe as fotos e vídeos do casamento de Débora & Luiz Gustavo." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Casamento D & L · 30·05·2026" },
      { name: "twitter:description", content: "Compartilhe as fotos e vídeos do casamento de Débora & Luiz Gustavo." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1a7b99e9-c863-4ef9-b465-f20e2abea373/id-preview-d1e623d1--5ab0507c-0612-49cf-8931-76701689fc3d.lovable.app-1779235905549.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1a7b99e9-c863-4ef9-b465-f20e2abea373/id-preview-d1e623d1--5ab0507c-0612-49cf-8931-76701689fc3d.lovable.app-1779235905549.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomNav />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

function AuthSync() {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      qc.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);
  return null;
}
