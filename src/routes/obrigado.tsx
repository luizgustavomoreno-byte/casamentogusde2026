import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/obrigado")({
  head: () => ({ meta: [{ title: "obrigado · casamento lg & dc" }] }),
  component: ObrigadoPage,
});

function ObrigadoPage() {
  return (
    <div className="min-h-screen bg-watercolor flex items-center justify-center px-4 fade-in">
      <div className="max-w-md w-full text-center">
        <svg viewBox="0 0 64 56" className="w-20 h-20 mx-auto text-rose-light" fill="currentColor" aria-hidden>
          <path d="M32 52s-22-13-22-30c0-8 6-14 13-14 4 0 7 2 9 5 2-3 5-5 9-5 7 0 13 6 13 14 0 17-22 30-22 30z" />
        </svg>
        <h1 className="font-serif text-4xl text-rose-deep mt-4">obrigado!</h1>
        <p className="mt-4 text-muted-foreground max-w-sm mx-auto">
          obrigado por guardar esse momento com a gente <span className="text-rose-light">♡</span>
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link to="/galeria" className="px-5 py-2.5 rounded-full bg-rose text-primary-foreground text-sm font-medium">
            ver galeria
          </Link>
          <Link to="/" className="px-5 py-2.5 rounded-full border-2 border-caramel text-caramel-text text-sm font-medium">
            enviar mais
          </Link>
        </div>
      </div>
    </div>
  );
}
