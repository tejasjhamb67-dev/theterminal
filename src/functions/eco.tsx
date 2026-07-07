import { useMemo } from 'react';
import type { FnProps } from '../core/types';
import { ScreenTitle } from '../components/widgets';
import { fmtDate } from '../core/fmt';

interface EcoEvent {
  time: number;
  country: string;
  event: string;
  period: string;
  survey: string;
  prior: string;
  actual?: string;
  relevance: number; // 1..3
}

/** Deterministic calendar around "today" — placeholder until a real
 *  economic-calendar connector is wired in (see docs/ARCHITECTURE.md). */
function buildCalendar(): EcoEvent[] {
  const now = new Date();
  const day = (offset: number, h: number, m = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    d.setHours(h, m, 0, 0);
    return d.getTime();
  };
  const monthName = now.toLocaleString('en-US', { month: 'short' });
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('en-US', { month: 'short' });
  return [
    { time: day(-2, 8, 30), country: 'US', event: 'Nonfarm Payrolls', period: prevMonth, survey: '110k', prior: '139k', actual: '147k', relevance: 3 },
    { time: day(-2, 8, 30), country: 'US', event: 'Unemployment Rate', period: prevMonth, survey: '4.3%', prior: '4.2%', actual: '4.1%', relevance: 3 },
    { time: day(-1, 10, 0), country: 'US', event: 'ISM Services Index', period: prevMonth, survey: '50.6', prior: '49.9', actual: '50.8', relevance: 2 },
    { time: day(0, 8, 30), country: 'US', event: 'Trade Balance', period: prevMonth, survey: '-$71.0b', prior: '-$61.6b', relevance: 1 },
    { time: day(0, 15, 0), country: 'US', event: 'Consumer Credit', period: prevMonth, survey: '$10.5b', prior: '$17.9b', relevance: 1 },
    { time: day(1, 6, 0), country: 'US', event: 'NFIB Small Business Optimism', period: prevMonth, survey: '98.7', prior: '98.8', relevance: 1 },
    { time: day(1, 14, 0), country: 'US', event: 'FOMC Meeting Minutes', period: '—', survey: '—', prior: '—', relevance: 3 },
    { time: day(2, 8, 30), country: 'US', event: 'Initial Jobless Claims', period: 'wk', survey: '235k', prior: '233k', relevance: 2 },
    { time: day(3, 8, 30), country: 'US', event: 'CPI MoM', period: monthName, survey: '0.3%', prior: '0.1%', relevance: 3 },
    { time: day(3, 8, 30), country: 'US', event: 'CPI YoY', period: monthName, survey: '2.6%', prior: '2.4%', relevance: 3 },
    { time: day(4, 8, 30), country: 'US', event: 'PPI Final Demand MoM', period: monthName, survey: '0.2%', prior: '0.1%', relevance: 2 },
    { time: day(4, 10, 0), country: 'US', event: 'U. of Mich. Sentiment (prelim)', period: monthName, survey: '61.0', prior: '60.7', relevance: 2 },
    { time: day(1, 5, 0), country: 'EU', event: 'Retail Sales MoM', period: prevMonth, survey: '-0.6%', prior: '0.1%', relevance: 1 },
    { time: day(2, 2, 0), country: 'DE', event: 'Industrial Production MoM', period: prevMonth, survey: '0.2%', prior: '-1.4%', relevance: 2 },
    { time: day(3, 2, 0), country: 'GB', event: 'Monthly GDP MoM', period: prevMonth, survey: '0.1%', prior: '-0.3%', relevance: 2 },
    { time: day(2, 21, 30), country: 'CN', event: 'CPI YoY', period: monthName, survey: '0.0%', prior: '-0.1%', relevance: 2 },
    { time: day(4, 19, 50), country: 'JP', event: 'PPI YoY', period: monthName, survey: '2.9%', prior: '3.2%', relevance: 1 },
  ].sort((a, b) => a.time - b.time);
}

export function EcoFn(_: FnProps) {
  const events = useMemo(buildCalendar, []);
  const now = Date.now();
  let lastDay = '';
  return (
    <>
      <ScreenTitle fn="ECO · Economic Calendar" sub="releases this week · ★ = market-moving · indicative survey/prior values" />
      <table className="grid">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Time</th>
            <th style={{ textAlign: 'left' }}>Ctry</th>
            <th style={{ textAlign: 'left' }}>Release</th>
            <th>Period</th>
            <th>Survey</th>
            <th>Prior</th>
            <th>Actual</th>
            <th>Rel</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => {
            const dayLabel = fmtDate(e.time);
            const showDay = dayLabel !== lastDay;
            lastDay = dayLabel;
            const past = e.time < now;
            return (
              <FragmentRow key={i} e={e} showDay={showDay} dayLabel={dayLabel} past={past} />
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function FragmentRow({ e, showDay, dayLabel, past }: { e: EcoEvent; showDay: boolean; dayLabel: string; past: boolean }) {
  return (
    <>
      {showDay && (
        <tr>
          <td colSpan={8} className="menu-section" style={{ borderBottom: 'none', paddingTop: 10 }}>{dayLabel}</td>
        </tr>
      )}
      <tr style={past ? { opacity: 0.55 } : undefined}>
        <td style={{ textAlign: 'left' }} className="dim">
          {new Date(e.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </td>
        <td style={{ textAlign: 'left' }} className="gold">{e.country}</td>
        <td style={{ textAlign: 'left' }}>{e.event}</td>
        <td className="dim">{e.period}</td>
        <td>{e.survey}</td>
        <td className="dim">{e.prior}</td>
        <td className={e.actual ? 'gold' : 'faint'}>{e.actual ?? '—'}</td>
        <td>{'★'.repeat(e.relevance)}</td>
      </tr>
    </>
  );
}
