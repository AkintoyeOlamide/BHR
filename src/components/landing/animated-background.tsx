export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#06060f]" />

      <div className="animate-gradient-shift absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="animate-gradient-shift-reverse absolute -right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-[100px]" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#06060f_75%)]" />
    </div>
  );
}
