export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-foreground">
      <h1 className="text-2xl font-bold m-0" style={{ fontFamily: "'Outfit', sans-serif" }}>
        Pas de connexion
      </h1>
      <p className="text-muted-foreground m-0 mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
        Connecte-toi pour voir les conditions
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="px-6 py-3 rounded-lg font-semibold border-0"
        style={{ background: '#00d4a8', color: '#070c16', fontFamily: "'Outfit', sans-serif" }}
      >
        Réessayer
      </button>
    </div>
  );
}
