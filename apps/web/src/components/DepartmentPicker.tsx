import { X } from 'lucide-react';
import { departmentLabel } from '../lib/departments';
import type { DepartmentOption } from '../lib/departments';

export function DepartmentPicker({
  departments,
  refreshingDept,
  onSelect,
  onClose,
}: {
  departments: DepartmentOption[];
  refreshingDept: string | null;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const sorted = [...departments].sort((a, b) => {
    if (a.scrapedCount > 0 && b.scrapedCount === 0) return -1;
    if (b.scrapedCount > 0 && a.scrapedCount === 0) return 1;
    return a.name.localeCompare(b.name, 'fr');
  });

  return (
    <div
      className="absolute inset-0 z-30 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(7,12,22,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          backgroundColor: '#0e1724',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="dept-picker-title"
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 id="dept-picker-title" className="text-lg font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Actualiser un département
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Space Mono', monospace" }}>
              Scores météo pour les spots configurés
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg" aria-label="Fermer">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="max-h-80 overflow-auto">
          {sorted.map((dept) => {
            const disabled = dept.scrapedCount === 0 || refreshingDept !== null;
            const isRefreshing = refreshingDept === dept.code;
            return (
              <button
                key={dept.code}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(dept.code)}
                className="w-full flex items-center justify-between px-5 py-3 text-left"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  opacity: disabled && !isRefreshing ? 0.45 : 1,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {departmentLabel(dept.code, dept.name)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {dept.catalogCount} spots carte
                    {dept.scrapedCount > 0 ? ` · ${dept.scrapedCount} scorables` : ' · scrape à venir'}
                  </div>
                </div>
                <span
                  className="text-xs font-medium px-2 py-1 rounded-lg"
                  style={{
                    color: dept.scrapedCount > 0 ? '#00d4a8' : 'rgba(232,237,245,0.4)',
                    backgroundColor: dept.scrapedCount > 0 ? 'rgba(0,212,168,0.1)' : 'rgba(255,255,255,0.04)',
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  {isRefreshing ? '…' : dept.scrapedCount > 0 ? 'Actualiser' : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
