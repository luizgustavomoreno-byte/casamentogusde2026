export function Hero() {
  return (
    <section className="text-center px-4 pt-8 pb-6 fade-in max-w-2xl mx-auto">
      <p className="font-sans text-[10px] tracking-[0.32em] text-[var(--text-tertiary)] uppercase mb-4">
        FEITO COM AMOR · D &amp; L
      </p>

      <div className="flex items-center justify-center gap-4 mb-5 font-serif text-xl sm:text-2xl text-[var(--text-tertiary)]">
        <span>30</span>
        <span className="w-1 h-1 rounded-full bg-rose-light opacity-60" />
        <span>05</span>
        <span className="w-1 h-1 rounded-full bg-rose-light opacity-60" />
        <span>2026</span>
      </div>

      <div className="mb-5">
        <svg viewBox="0 0 36 32" className="w-9 h-8 mx-auto" aria-hidden>
          <path
            d="M18 30 C 18 30, 2 20, 2 10 C 2 5, 6 2, 10 2 C 14 2, 17 5, 18 8 C 19 5, 22 2, 26 2 C 30 2, 34 5, 34 10 C 34 20, 18 30, 18 30 Z"
            fill="#E89BAE"
          />
        </svg>
      </div>

      <h1 className="font-serif text-4xl sm:text-6xl text-rose-deep leading-[1.05] mb-5 -tracking-[0.5px]">
        Débora <span className="italic text-rose" style={{ fontSize: "0.88em" }}>&amp;</span> Luiz Gustavo
      </h1>

      <p className="font-serif italic text-sm sm:text-base leading-relaxed text-[#9B7A82] max-w-md mx-auto">
        cada olhar, cada sorriso, cada detalhe.<br />
        compartilhe com a gente as fotos e vídeos que você registrou hoje{" "}
        <span className="text-rose">♡</span>
      </p>
    </section>
  );
}
