export function FestivalMarker({ name, planned }: { name: string; planned: boolean }) {
  return (
    <span
      tabIndex={0}
      role="img"
      aria-label={`${name}. ${planned ? "Greeting post planned" : "No greeting planned yet"}`}
      data-tip={`${name} · ${planned ? "Greeting post planned" : "No greeting yet"}`}
      className="inline-grid size-5 place-items-center rounded-full"
      style={{ boxShadow: "0 0 10px 2px color-mix(in srgb, var(--accent) 55%, transparent)" }}
    >
      {/* Original diya-flame glyph */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2c2.5 3 4 5.2 4 8a4 4 0 0 1-8 0c0-1.6.8-3 1.6-4.2C10.2 7 11 6 12 2Z" fill="var(--accent)" />
        <path d="M4 16h16a8 8 0 0 1-16 0Z" stroke="var(--accent)" strokeWidth="1.6" />
      </svg>
    </span>
  );
}
