export function BackgroundScene() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-espresso/30 to-obsidian" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(201,169,110,0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 50%, rgba(201,169,110,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(139,94,60,0.04) 0%, transparent 50%)
          `,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-obsidian/80" />
    </div>
  );
}
