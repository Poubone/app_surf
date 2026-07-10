export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="network-error">
      <h1>Pas de connexion</h1>
      <p>Connecte-toi pour voir les conditions</p>
      <button type="button" onClick={onRetry}>
        Réessayer
      </button>
      <style>{`
        .network-error {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .network-error h1 { margin: 0; font-size: 1.5rem; }
        .network-error p { color: #666; margin: 0 0 16px; }
        .network-error button {
          background: #2563eb;
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
