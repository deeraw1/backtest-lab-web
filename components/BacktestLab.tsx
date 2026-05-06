"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from "recharts";

type Metrics = {
  cagr: number; vol: number; sharpe: number; sortino: number;
  calmar: number; max_dd: number; win_rate: number; skew: number; kurt: number;
};

type BacktestRes = {
  metrics: Metrics;
  benchmark_metrics: Metrics;
  regime_perf: Record<string, Metrics>;
  equity: { date: string; strategy: number; benchmark: number }[];
  drawdown: { date: string; dd: number }[];
  n_observations: number;
  gross_exposure_avg: number;
};

type WFRes = {
  folds: any[];
  aggregate: { mean_sharpe: number; sharpe_std: number; consistency: number; n_folds: number };
};

const STRATEGIES = [
  { id: "momentum", label: "Cross-Sectional Momentum",
    desc: "63-day price momentum, long top decile / short bottom decile, equal-weight." },
  { id: "mean_reversion", label: "Short-Horizon Mean Reversion",
    desc: "5-day return z-score reversal, vol-normalised at the row level." },
  { id: "vol_target", label: "Vol-Targeted Carry",
    desc: "Equal-weight long-only sleeve scaled to a target 10% portfolio vol." },
  { id: "pairs", label: "Engle-Granger Pairs",
    desc: "Cointegration-style pair trade on the two most-correlated names." },
];

const fmt = (x: number, d = 2) => Number.isFinite(x) ? x.toFixed(d) : "—";
const pct = (x: number, d = 2) => (x * 100).toFixed(d) + "%";

export default function BacktestLab() {
  const [strategy, setStrategy] = useState("momentum");
  const [nAssets, setNAssets] = useState(5);
  const [nDays, setNDays] = useState(1500);
  const [seed, setSeed] = useState(7);
  const [costBps, setCostBps] = useState(5);
  const [slipBps, setSlipBps] = useState(2);
  const [tab, setTab] = useState<"single" | "wf">("single");
  const [res, setRes] = useState<BacktestRes | null>(null);
  const [wf, setWF] = useState<WFRes | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function runSingle() {
    setBusy(true); setErr(""); setWF(null);
    try {
      setRes(await api("/backtest", {
        strategy, n_assets: nAssets, n_days: nDays, seed,
        cost_bps: costBps, slippage_bps: slipBps,
      }));
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function runWF() {
    setBusy(true); setErr(""); setRes(null);
    try {
      setWF(await api("/walk-forward", {
        strategy, n_assets: nAssets, n_days: nDays, seed,
        cost_bps: costBps, slippage_bps: slipBps,
        train_window: 252, test_window: 63,
      }));
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  const meta = STRATEGIES.find(s => s.id === strategy)!;

  return (
    <div style={{ minHeight: "100vh", padding: "40px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <header style={{ marginBottom: 36 }}>
          <div className="section-label">Systematic Strategy Validation</div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.5px" }}>
            Backtest Lab
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 8, maxWidth: 760, fontSize: "0.95rem" }}>
            Vectorised multi-strategy backtester with transaction costs, slippage,
            regime-conditional decomposition, and walk-forward Sharpe stability.
          </p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
          <div className="card" style={{ height: "fit-content", position: "sticky", top: 24 }}>
            <div className="section-title">Configuration</div>
            <div style={{ marginBottom: 14 }}>
              <label className="label">Strategy</label>
              <select className="select" value={strategy} onChange={e => setStrategy(e.target.value)}>
                {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <p style={{ fontSize: "0.78rem", color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>{meta.desc}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div><label className="label">Assets</label>
                <input className="input" type="number" min={2} max={10} value={nAssets} onChange={e => setNAssets(+e.target.value)} /></div>
              <div><label className="label">Days</label>
                <input className="input" type="number" min={300} max={4000} value={nDays} onChange={e => setNDays(+e.target.value)} /></div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="label">Seed</label>
              <input className="input" type="number" value={seed} onChange={e => setSeed(+e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div><label className="label">Costs (bps)</label>
                <input className="input" type="number" value={costBps} onChange={e => setCostBps(+e.target.value)} step="0.5" /></div>
              <div><label className="label">Slippage (bps)</label>
                <input className="input" type="number" value={slipBps} onChange={e => setSlipBps(+e.target.value)} step="0.5" /></div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="btn" onClick={runSingle} disabled={busy} style={{ flex: 1 }}>
                {busy && tab === "single" ? "Running..." : "Single run"}
              </button>
              <button className="btn" onClick={runWF} disabled={busy} style={{ flex: 1, background: "transparent", border: "1px solid var(--border2)", color: "var(--accent2)" }}>
                {busy && tab === "wf" ? "Running..." : "Walk-forward"}
              </button>
            </div>
            {err && <div style={{ color: "var(--bad)", fontSize: "0.8rem", marginTop: 12 }}>{err}</div>}

            <div style={{ marginTop: 26, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
              <div className="section-label">Note</div>
              <p style={{ fontSize: "0.78rem", color: "var(--faint)", lineHeight: 1.6 }}>
                Universe is synthetic GBM with an injected high-vol bear regime
                in the middle third — designed to expose strategies that look
                strong only in trending markets.
              </p>
            </div>
          </div>

          <div>
            {!res && !wf && (
              <div className="card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--faint)" }}>
                Run a backtest to see equity, drawdown, and risk metrics.
              </div>
            )}

            {res && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                  <KPI label="Sharpe" value={fmt(res.metrics.sharpe)} accent />
                  <KPI label="Sortino" value={fmt(res.metrics.sortino)} />
                  <KPI label="CAGR" value={pct(res.metrics.cagr)} />
                  <KPI label="Max DD" value={pct(res.metrics.max_dd)} bad />
                  <KPI label="Vol (ann.)" value={pct(res.metrics.vol)} />
                  <KPI label="Calmar" value={fmt(res.metrics.calmar)} />
                  <KPI label="Win rate" value={pct(res.metrics.win_rate, 1)} />
                  <KPI label="Skew" value={fmt(res.metrics.skew)} />
                </div>

                <div className="card" style={{ marginBottom: 20 }}>
                  <div className="section-title">Equity curve vs benchmark</div>
                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer>
                      <LineChart data={res.equity} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                        <CartesianGrid stroke="#181f2e" strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#8a9ab8" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#8a9ab8" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #1e2d44" }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="strategy" stroke="#7c3aed" dot={false} strokeWidth={2} />
                        <Line type="monotone" dataKey="benchmark" stroke="#8a9ab8" dot={false} strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 20 }}>
                  <div className="section-title">Drawdown</div>
                  <div style={{ width: "100%", height: 200 }}>
                    <ResponsiveContainer>
                      <AreaChart data={res.drawdown} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                        <CartesianGrid stroke="#181f2e" strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#8a9ab8" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#8a9ab8" tick={{ fontSize: 11 }}
                                tickFormatter={(v) => (v * 100).toFixed(0) + "%"} />
                        <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #1e2d44" }}
                                  formatter={(v: any) => (v * 100).toFixed(2) + "%"} />
                        <Area type="monotone" dataKey="dd" stroke="#f87171" fill="rgba(248,113,113,0.12)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="section-title">Regime decomposition</div>
                  <div style={{ overflowX: "auto" }}>
                    <table>
                      <thead>
                        <tr><th>Regime</th><th>Sharpe</th><th>Vol</th><th>Max DD</th><th>Win rate</th></tr>
                      </thead>
                      <tbody>
                        {Object.entries(res.regime_perf).map(([r, m]) => (
                          <tr key={r}>
                            <td><span className={"pill " + (r === "bull" ? "pill-good" : r === "bear" ? "pill-bad" : "pill-neutral")}>{r}</span></td>
                            <td>{fmt(m.sharpe)}</td>
                            <td>{pct(m.vol)}</td>
                            <td>{pct(m.max_dd)}</td>
                            <td>{pct(m.win_rate, 1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {wf && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                  <KPI label="Mean OOS Sharpe" value={fmt(wf.aggregate.mean_sharpe)} accent />
                  <KPI label="Sharpe σ across folds" value={fmt(wf.aggregate.sharpe_std)} />
                  <KPI label="Consistency" value={pct(wf.aggregate.consistency, 1)} />
                  <KPI label="Folds" value={String(wf.aggregate.n_folds)} />
                </div>

                <div className="card" style={{ marginBottom: 20 }}>
                  <div className="section-title">Out-of-sample Sharpe per fold</div>
                  <div style={{ width: "100%", height: 280 }}>
                    <ResponsiveContainer>
                      <BarChart data={wf.folds} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                        <CartesianGrid stroke="#181f2e" strokeDasharray="3 3" />
                        <XAxis dataKey="fold" stroke="#8a9ab8" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#8a9ab8" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #1e2d44" }} />
                        <ReferenceLine y={0} stroke="#3a4a60" />
                        <Bar dataKey="sharpe" fill="#7c3aed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="section-title">Walk-forward fold detail</div>
                  <div style={{ overflowX: "auto", maxHeight: 360 }}>
                    <table>
                      <thead>
                        <tr><th>#</th><th>Test window</th><th>Sharpe</th><th>Sortino</th><th>CAGR</th><th>Max DD</th><th>Win</th></tr>
                      </thead>
                      <tbody>
                        {wf.folds.map(f => (
                          <tr key={f.fold}>
                            <td>{f.fold}</td>
                            <td style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{f.test_start} → {f.test_end}</td>
                            <td>{fmt(f.sharpe)}</td>
                            <td>{fmt(f.sortino)}</td>
                            <td>{pct(f.cagr)}</td>
                            <td>{pct(f.max_dd)}</td>
                            <td>{pct(f.win_rate, 1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, accent = false, bad = false }: { label: string; value: string; accent?: boolean; bad?: boolean }) {
  return (
    <div className="card-tight">
      <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: "1.25rem", fontWeight: 700, fontVariantNumeric: "tabular-nums",
                    color: accent ? "var(--accent2)" : bad ? "var(--bad)" : "var(--text)" }}>{value}</div>
    </div>
  );
}
