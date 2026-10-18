// Faint graph-paper dots, fading out toward the edges.
export default function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#17150f_1px,transparent_1px)] bg-size-[22px_22px] opacity-[0.09] mask-[radial-gradient(ellipse_70%_60%_at_50%_35%,#000_30%,transparent_100%)]" />
  );
}
