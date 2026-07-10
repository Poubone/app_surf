import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Wind, Thermometer, Compass, Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { getBestHourForDay, getScoreRowForHour, spotForHour } from '../hooks/useSurfConditions';
import { hourFromIso } from '../lib/days';
import { getScoreColor, getScoreLabel } from '../lib/display';
import type { SpotView } from '../types';
import { HourlyBar } from './HourlyBar';
import { ScoreBreakdownPanel } from './ScoreBreakdownPanel';
import { ScoreRing } from './ScoreRing';
import { SpotInfoPanel } from './SpotInfoPanel';
import { WebcamPanel } from './WebcamPanel';
import { StatCard } from './StatCard';

function parseHourLabel(label: string): number {
  return Number(label.replace('h', ''));
}

export function DetailView({
  spot,
  onBack,
  initialDay = 0,
}: {
  spot: SpotView;
  onBack: () => void;
  initialDay?: number;
}) {
  const [dayIndex, setDayIndex] = useState(initialDay);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [showScoreDetail, setShowScoreDetail] = useState(false);

  useEffect(() => {
    setSelectedHour(null);
  }, [dayIndex]);

  const view = useMemo(() => spotForHour(spot, dayIndex, selectedHour), [spot, dayIndex, selectedHour]);
  const scoreRow = useMemo(() => getScoreRowForHour(spot, dayIndex, selectedHour), [spot, dayIndex, selectedHour]);
  const bestHour = useMemo(() => getBestHourForDay(spot, dayIndex), [spot, dayIndex]);
  const activeHour = scoreRow ? hourFromIso(scoreRow.time) : null;
  const hourLabel = activeHour != null ? `${activeHour.toString().padStart(2, '0')}h` : null;
  const maxH = Math.max(...view.hourly.map((h) => h.height), 0.1);
  const color = getScoreColor(view.score);

  if (spot.error) {
    return (
      <div className="flex flex-col h-full p-8 text-destructive">
        <button type="button" onClick={onBack} className="mb-4 text-muted-foreground flex items-center gap-2">
          <ArrowLeft size={16} /> Retour
        </button>
        Données indisponibles : {spot.error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
      <div
        className="relative flex flex-col px-6 pt-6 pb-8"
        style={{
          background: `linear-gradient(160deg, ${color}18 0%, #070c16 60%)`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm mb-8 w-fit"
          style={{ color: 'rgba(232,237,245,0.6)', fontFamily: "'Outfit', sans-serif" }}
        >
          <ArrowLeft size={16} />
          Retour
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <MapPin size={13} style={{ color }} />
              <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                {view.region}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: `${color}18`, color, fontFamily: "'Space Mono', monospace", fontSize: '0.6rem' }}
              >
                {spot.dayLabels[dayIndex] ?? '—'}
              </span>
              {hourLabel && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: 'rgba(232,237,245,0.7)',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.6rem',
                  }}
                >
                  {hourLabel}
                </span>
              )}
            </div>
            <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: '-0.03em' }}>
              {view.name}
            </h2>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ScoreRing score={view.score} size={72} />
            <p className="text-xs text-muted-foreground mt-1 text-center" style={{ fontFamily: "'Space Mono', monospace" }}>
              {view.score}/100 · {getScoreLabel(view.score)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-2xl">{view.weather.emoji}</span>
          <div>
            <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {view.weather.temp}°C
            </span>
            <span className="text-sm text-muted-foreground ml-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {view.weather.condition}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
            <Clock size={12} />
            {view.tide}
          </div>
        </div>

        {bestHour && (
          <div
            className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl w-fit"
            style={{
              backgroundColor: 'rgba(0,212,168,0.1)',
              border: '1px solid rgba(0,212,168,0.25)',
            }}
          >
            <Clock size={14} style={{ color: '#00d4a8' }} />
            <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Meilleur créneau : {bestHour.hour}
            </span>
            <span className="text-sm font-bold" style={{ color: getScoreColor(bestHour.score), fontFamily: "'Space Mono', monospace" }}>
              {bestHour.score}/100
            </span>
          </div>
        )}
      </div>

      <div className="px-6 py-5 flex flex-col gap-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground m-0" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem' }}>
          Prévisions horaires
        </h3>
        <p className="text-xs text-muted-foreground m-0 -mt-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Touchez un créneau pour voir les conditions à cette heure
        </p>
        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex gap-1.5">
            {view.hourly.map((h) => {
              const hour = parseHourLabel(h.hour);
              return (
                <HourlyBar
                  key={h.hour}
                  h={h}
                  maxH={maxH}
                  selected={activeHour === hour}
                  onSelect={() => setSelectedHour(hour)}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col gap-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem' }}>
          {hourLabel ? `Conditions à ${hourLabel}` : 'Conditions du jour'}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<span style={{ fontSize: '1.1rem' }}>🌊</span>} label="Hauteur" value={`${view.waves.height} m`} sub={`Période ${view.waves.period}s`} color={color} />
          <StatCard icon={<Wind size={16} />} label="Vent" value={`${view.wind.speed} kn`} sub={`Rafales ${view.wind.gust} kn`} color="#00aaff" />
          <StatCard icon={<Compass size={16} />} label="Direction" value={view.waves.direction} sub={`Vent ${view.wind.direction}`} color="#a78bfa" />
          <StatCard icon={<Thermometer size={16} />} label="Eau" value={`${view.water.temp}°C`} sub="Température surf" color="#ffb84d" />
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground m-0" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem' }}>
            Score /100
          </h3>
          {scoreRow && (
            <button
              type="button"
              onClick={() => setShowScoreDetail((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: 'rgba(0,212,168,0.1)',
                border: '1px solid rgba(0,212,168,0.25)',
                color: '#00d4a8',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {showScoreDetail ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showScoreDetail ? 'Masquer le détail' : 'Détail du scoring'}
            </button>
          )}
        </div>
        {showScoreDetail && scoreRow && (
          <ScoreBreakdownPanel row={scoreRow} config={spot.scoringConfig} tideUnavailable={spot.tideUnavailable} />
        )}
      </div>

      <div className="px-6 pb-5 flex flex-col gap-5">
        <WebcamPanel spot={spot} />
        <SpotInfoPanel spot={spot} />
      </div>

      <div className="px-6 pb-8 flex flex-col gap-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem' }}>
          Cette semaine
        </h3>
        <div className="flex gap-2 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {spot.weeklyScores.map((s, i) => {
            const c = getScoreColor(s);
            const isActive = i === dayIndex;
            const label = spot.dayLabels[i] ?? '';
            return (
              <button
                key={label + i}
                type="button"
                onClick={() => setDayIndex(i)}
                className="flex flex-col items-center gap-2 flex-1"
              >
                <span className="text-xs font-bold" style={{ color: isActive ? c : 'rgba(232,237,245,0.35)', fontFamily: "'Space Mono', monospace", fontSize: '0.6rem' }}>
                  {label}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border"
                  style={{
                    backgroundColor: isActive ? `${c}25` : 'rgba(255,255,255,0.03)',
                    borderColor: isActive ? c : 'rgba(255,255,255,0.07)',
                    color: isActive ? c : 'rgba(232,237,245,0.4)',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.7rem',
                    boxShadow: isActive ? `0 0 10px ${c}35` : 'none',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {s}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
