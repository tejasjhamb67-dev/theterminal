import type { FnCategory, FnProps, FunctionDef } from '../core/types';
import { ScreenTitle } from '../components/widgets';
import { allFns, getFn } from '../core/registry';
import { CATALOG } from './catalog';

/** Placeholder screen for spec'd-but-unbuilt functions. */
function StubScreen({ def }: { def: FunctionDef }) {
  return function Stub({ panel }: FnProps) {
    const siblings = allFns().filter((f) => !f.stub && f.category === def.category).slice(0, 8);
    return (
      <>
        <ScreenTitle fn={`${def.mnemonic} · ${def.name}`} sub={def.category} />
        <div className="pill gold" style={{ marginBottom: 10 }}>ON THE ROADMAP</div>
        <div className="prose" style={{ marginBottom: 14 }}>{def.description}</div>
        <div className="prose faint">
          This function is registered from the Bloomberg feature inventory
          (docs/BLOOMBERG_TERMINAL_FEATURES.md) and will light up in a later phase.
        </div>
        {siblings.length > 0 && (
          <>
            <div className="menu-section">Live today in {def.category}</div>
            <div className="menu-list">
              {siblings.map((f, i) => (
                <div key={f.mnemonic} className="menu-item" onClick={() => panel.execute(f.mnemonic)}>
                  <span className="mi-num">{i + 1})</span>
                  <span className="mi-label">{f.mnemonic}</span>
                  <span className="mi-detail">{f.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    );
  };
}

type StubSpec = [string, string, FnCategory, string];

/** Roadmap functions from the feature inventory, registered as stubs so the
 *  command line, autocomplete, and HELP already know about them. */
export const STUB_SPECS: StubSpec[] = [
  // Equities
  ['CACS', 'Corporate Actions', 'Equities', 'Splits, spin-offs, buybacks and other corporate actions.'],
  ['OWN', 'Ownership', 'Equities', 'Institutional and insider holders with position changes.'],
  ['SI', 'Short Interest', 'Equities', 'Short interest, days-to-cover and borrow trends.'],
  ['MA', 'M&A Deals', 'Equities', 'Deal database with terms, premia and league tables.'],
  ['IPO', 'Equity Offerings', 'Equities', 'IPO and follow-on calendar with pricing detail.'],
  ['SPLC', 'Supply Chain', 'Equities', 'Customer/supplier relationship map with revenue dependency.'],
  ['BI', 'Industry Intelligence', 'Equities', 'Industry dashboards, primers and comparative data.'],
  ['ESG', 'ESG Profile', 'Equities', 'Sustainability scores, emissions and disclosure data.'],
  ['FSRC', 'Fund Screener', 'Equities', 'Screen funds and ETFs by flows, fees and performance.'],
  // Charting
  ['HS', 'Historical Spread', 'Charting', 'Spread/ratio chart between two securities.'],
  // Fixed income
  ['ALLQ', 'All Quotes', 'Fixed Income', 'Composite dealer quotes on a bond.'],
  ['FWCV', 'Forward Curves', 'Fixed Income', 'Project forward rates from today’s curve.'],
  ['CDSW', 'CDS Calculator', 'Fixed Income', 'Credit-default-swap pricing with the ISDA standard model.'],
  ['CRPR', 'Credit Ratings', 'Fixed Income', 'Agency rating history for an issuer.'],
  ['NIM', 'New Issue Monitor', 'Fixed Income', 'Primary-market calendar with pricing and books.'],
  ['SRCH', 'Bond Search', 'Fixed Income', 'Screen the bond universe by coupon, maturity, covenant and sector.'],
  ['BTMM', 'Treasury & Money Markets', 'Fixed Income', 'One-screen money-market cockpit per country.'],
  ['DDIS', 'Debt Distribution', 'Fixed Income', 'Issuer maturity wall visualization.'],
  // Derivatives
  ['OSA', 'Scenario Analysis', 'Derivatives', 'Position P&L surfaces across spot, vol and time.'],
  ['SWPM', 'Swap Manager', 'Derivatives', 'Price and risk interest-rate swaps, OIS, caps/floors and swaptions.'],
  ['VCUB', 'Volatility Cube', 'Derivatives', 'Swaption and cap/floor vol surfaces.'],
  ['CT', 'Contract Table', 'Derivatives', 'All futures expiries for a root with volume and OI.'],
  ['DLV', 'Deliverables', 'Derivatives', 'Cheapest-to-deliver analysis for bond futures.'],
  // FX
  ['FRD', 'FX Forwards', 'FX', 'Forward points, outrights and implied yields.'],
  ['FXFC', 'FX Forecasts', 'FX', 'Bank-by-bank currency forecasts with composites.'],
  ['BFIX', 'FX Fixings', 'FX', 'Benchmark fixing rates through the day.'],
  ['XCCY', 'Cross-Currency Basis', 'FX', 'Basis-swap levels across tenors.'],
  // Commodities
  ['FWCM', 'Forward Curve Matrix', 'Commodities', 'Futures curves in contango/backwardation view.'],
  ['SEAG', 'Seasonality', 'Commodities', 'Seasonal price patterns by contract.'],
  ['WETR', 'Weather', 'Commodities', 'Temperature, precipitation and storm-track dashboards.'],
  ['SHIP', 'Ship Tracking', 'Commodities', 'Tanker and dry-bulk movements on the map.'],
  // Economics
  ['ECST', 'Economic Statistics', 'Economics', 'Country dashboards — GDP, inflation, labor, trade trees.'],
  ['ECFC', 'Economic Forecasts', 'Economics', 'Economist forecasts by bank with composites.'],
  ['WECO', 'World Calendar Matrix', 'Economics', 'Cross-country release matrix.'],
  ['FED', 'Central Bank Hub', 'Economics', 'Statements, minutes, speakers and balance-sheet trackers.'],
  ['TAYL', 'Taylor Rule', 'Economics', 'Policy-rate model calculator.'],
  // News
  ['NLRT', 'News Alerts', 'News', 'Keyword and ticker alerting to pop-up and mobile.'],
  ['READ', 'Most Read', 'News', 'Trending stories across all users.'],
  ['FIRS', 'First Word', 'News', 'Fast, trader-oriented headline squawk.'],
  // Portfolio
  ['LQA', 'Liquidity Assessment', 'Portfolio', 'Liquidation cost and time per position.'],
  // Communication
  ['MSG', 'Messages', 'Communication', 'Terminal mail — the @bloomberg.net of this workstation.'],
  ['IB', 'Instant Chat', 'Communication', 'Real-time chat: 1:1, rooms and blasts.'],
  ['PEOP', 'People Directory', 'Communication', 'Search people, roles and firms.'],
  // Trading
  ['EMSX', 'Execution Management', 'Trading', 'Route equity orders to broker algos with TCA.'],
  ['FXGO', 'FX Trading', 'Trading', 'Multi-dealer RFQ and streaming FX execution.'],
  ['TSOX', 'Fixed Income EMS', 'Trading', 'RFQ and list trading for bonds and derivatives.'],
  ['IOIA', 'Indications of Interest', 'Trading', 'Advertised broker flow and axes.'],
  // System extras
  ['GRAB', 'Screen Capture', 'System', 'Snapshot the current screen to share.'],
  ['PDFS', 'Personal Defaults', 'System', 'Base currency, default ranges and appearance settings.'],
  ['BU', 'Terminal University', 'System', 'Interactive tutorials and certification.'],
];

export function buildStubDefs(): FunctionDef[] {
  const combined: Array<{ mnemonic: string; name: string; category: FnCategory; description: string }> = [
    ...STUB_SPECS.map(([mnemonic, name, category, description]) => ({ mnemonic, name, category, description })),
    ...CATALOG,
  ];
  const out: FunctionDef[] = [];
  const seen = new Set<string>();
  for (const e of combined) {
    const key = e.mnemonic.toUpperCase();
    // Never shadow a live function or alias; dedupe within the catalog.
    if (seen.has(key) || getFn(key)) continue;
    seen.add(key);
    const def: FunctionDef = { ...e, stub: true, component: () => null };
    def.component = StubScreen({ def });
    out.push(def);
  }
  return out;
}
