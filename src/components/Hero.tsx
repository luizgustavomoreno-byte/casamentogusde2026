export function Hero() {
  return (
    <section className="text-center px-4 pt-10 pb-8 fade-in">
      <p className="label-eyebrow mb-4">Feito com amor · D &amp; L</p>
      <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground tracking-[0.3em]">
        <span>30</span><span className="text-rose-light">·</span>
        <span>05</span><span className="text-rose-light">·</span>
        <span>2026</span>
      </div>
      <svg viewBox="0 0 64 56" className="w-12 h-12 mx-auto my-5 text-rose-light" fill="currentColor" aria-hidden>
        <path d="M32 52s-22-13-22-30c0-8 6-14 13-14 4 0 7 2 9 5 2-3 5-5 9-5 7 0 13 6 13 14 0 17-22 30-22 30z" opacity=".85"/>
      </svg>
      <h1 className="font-serif text-4xl sm:text-5xl text-rose-deep">
        Débora <span className="text-rose-light italic">&amp;</span> Luiz Gustavo
      </h1>
      <p className="mt-5 max-w-md mx-auto text-sm leading-relaxed text-muted-foreground">
        cada olhar, cada sorriso, cada detalhe. compartilhe com a gente as fotos e vídeos
        que você registrou hoje <span className="text-rose-light">♡</span>
      </p>
    </section>
  );
}
