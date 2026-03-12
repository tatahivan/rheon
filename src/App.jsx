import { useState, useEffect, useCallback } from "react";

// ============================================================
// WALLET HELPERS
// ============================================================
const CHAINS = {
  "0xa4b1": { name: "Arbitrum One", color: "#81C784", testnet: false },
  "0x66eee": { name: "Arbitrum Sepolia", color: "#FFB74D", testnet: true },
  "0x1": { name: "Ethereum", color: "#627EEA", testnet: false },
  "0xaa36a7": { name: "Sepolia", color: "#FFB74D", testnet: true },
};
const ARB_SEPOLIA_ID = "0x66eee";
const shortAddr = (a) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "";
const INITIAL_TRADES = [
  { id: "TRD-2026-0001", state: "Released", buyer: "Zenith Petroleum Ltd", buyerWallet: "0x7a3B...f9c2", exporter: "Vitol SA", exporterWallet: "0x4eD8...a1b3", commodity: "ULSD 10ppm", volume: "30,000 MT", totalAmount: 10000000, buyerMargin: 2500000, poolCapital: 7500000, marginPct: 25, escrowAddress: "0x1234...abcd", createdAt: "2026-02-18", fundedAt: "2026-02-18", shippedAt: "2026-02-22", inspectedAt: "2026-03-01", releasedAt: "2026-03-01", expiresAt: "2026-03-20", repaymentStatus: "Completed", repaymentReceived: 10150000, inspector: "SGS", tradeTerms: "CIF Lagos", tenor: 30, yieldRate: 1.5, platformFee: 1.25, notes: "" },
  { id: "TRD-2026-0002", state: "Funded", buyer: "Oando Energy", buyerWallet: "0x9fA1...d4e7", exporter: "Trafigura Pte", exporterWallet: "0x3cB2...e8f1", commodity: "PMS (Gasoline)", volume: "25,000 MT", totalAmount: 8500000, buyerMargin: 2125000, poolCapital: 6375000, marginPct: 25, escrowAddress: "0x5678...ef01", createdAt: "2026-03-02", fundedAt: "2026-03-02", shippedAt: null, inspectedAt: null, releasedAt: null, expiresAt: "2026-03-25", repaymentStatus: "Pending", repaymentReceived: 0, inspector: "Bureau Veritas", tradeTerms: "CIF Apapa", tenor: 25, yieldRate: 1.75, platformFee: 1.25, notes: "" },
  { id: "TRD-2026-0003", state: "Created", buyer: "MRS Oil & Gas", buyerWallet: "0x2dE3...b5a9", exporter: "Mercuria Energy", exporterWallet: "0x8aF4...c2d6", commodity: "AGO (Diesel)", volume: "20,000 MT", totalAmount: 7200000, buyerMargin: 1800000, poolCapital: 5400000, marginPct: 25, escrowAddress: "0x9abc...2345", createdAt: "2026-03-05", fundedAt: null, shippedAt: null, inspectedAt: null, releasedAt: null, expiresAt: "2026-03-30", repaymentStatus: "N/A", repaymentReceived: 0, inspector: "Intertek", tradeTerms: "FOB Rotterdam", tenor: 30, yieldRate: 2.0, platformFee: 1.0, notes: "" },
];
const POOL_STATS = { totalCapital: 15000000, deployed: 13875000, available: 1125000, totalTrades: 47, activeTrades: 2, avgCycleTime: 14.2, ytdReturn: 8.7, annualisedReturn: 26.1 };
const fmt = (n) => { if (n >= 1e6) return `$${(n/1e6).toFixed(2)}M`; if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`; return `$${n}`; };
const fmtFull = (n) => `$${n.toLocaleString("en-US")}`;
const stateColor = { Created: { bg: "#FFF3E0", text: "#E65100", border: "#FFB74D" }, Funded: { bg: "#E3F2FD", text: "#1565C0", border: "#64B5F6" }, Released: { bg: "#E8F5E9", text: "#2E7D32", border: "#81C784" }, Expired: { bg: "#FFEBEE", text: "#C62828", border: "#E57373" }, Cancelled: { bg: "#F5F5F5", text: "#616161", border: "#BDBDBD" } };
const todayStr = () => new Date().toISOString().split("T")[0];
const futureStr = (d) => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString().split("T")[0]; };

function StatCard({ label, value, sub, accent }) {
  return (<div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", border: "1px solid #E8ECF0", flex: "1 1 180px", minWidth: 160 }}>
    <div style={{ fontSize: 12, color: "#8895A7", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: accent || "#1B2A4A", lineHeight: 1.2 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "#8895A7", marginTop: 4 }}>{sub}</div>}
  </div>);
}
function Badge({ state }) {
  const c = stateColor[state] || stateColor.Created;
  return (<span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{state.toUpperCase()}</span>);
}
function TimelineStep({ label, date, done, active }) {
  return (<div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
    <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: done ? "#2E7D32" : active ? "#1565C0" : "#E0E0E0", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{done ? "\u2713" : active ? "\u2022" : ""}</div>
    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: done ? "#2E7D32" : active ? "#1565C0" : "#999" }}>{label}</div></div>
    <div style={{ fontSize: 12, color: "#8895A7", minWidth: 80, textAlign: "right" }}>{date || "\u2014"}</div>
  </div>);
}
function FundingBar({ buyerMargin, poolCapital, buyerDeposited, poolDeposited }) {
  const total = buyerMargin + poolCapital; const bp = (buyerMargin/total)*100; const pp = (poolCapital/total)*100;
  const bf = buyerMargin > 0 ? ((buyerDeposited||buyerMargin)/buyerMargin)*bp : 0;
  const pf = poolCapital > 0 ? ((poolDeposited||poolCapital)/poolCapital)*pp : 0;
  return (<div>
    <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
      <div style={{ height: 8, borderRadius: 4, background: "#E3F2FD", flex: bp, position: "relative", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 4, background: "#1565C0", width: `${(bf/bp)*100}%`, transition: "width 0.3s" }} /></div>
      <div style={{ height: 8, borderRadius: 4, background: "#F3E5F5", flex: pp, position: "relative", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 4, background: "#7B1FA2", width: `${(pf/pp)*100}%`, transition: "width 0.3s" }} /></div>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8895A7" }}>
      <span><span style={{ color: "#1565C0", fontWeight: 600 }}>Buyer margin</span> {fmt(buyerMargin)}</span>
      <span><span style={{ color: "#7B1FA2", fontWeight: 600 }}>Pool capital</span> {fmt(poolCapital)}</span>
    </div>
  </div>);
}
function FormField({ label, sub, children }) {
  return (<div style={{ marginBottom: 18 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#3D5A80", marginBottom: 5 }}>{label}{sub && <span style={{ fontWeight: 400, color: "#8895A7", marginLeft: 6, fontSize: 11 }}>{sub}</span>}</label>
    {children}
  </div>);
}
function Input({ value, onChange, placeholder, type = "text", prefix, disabled }) {
  return (<div style={{ display: "flex", alignItems: "center", border: "1px solid #D0D7DE", borderRadius: 8, overflow: "hidden", background: disabled ? "#F8FAFC" : "#fff" }}>
    {prefix && <div style={{ padding: "10px 12px", background: "#F8FAFC", borderRight: "1px solid #D0D7DE", fontSize: 13, color: "#8895A7", fontWeight: 600 }}>{prefix}</div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} style={{ flex: 1, padding: "10px 14px", border: "none", fontSize: 14, outline: "none", fontFamily: "inherit", background: "transparent", color: "#1B2A4A" }} />
  </div>);
}
function Select({ value, onChange, options }) {
  return (<select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D0D7DE", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fff", color: "#1B2A4A", cursor: "pointer" }}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>);
}

function DashboardPage() {
  return (<div>
    <div style={{ marginBottom: 24 }}><h2 style={{ margin: 0, fontSize: 22, color: "#1B2A4A", fontWeight: 700 }}>Capital Pool Overview</h2><p style={{ margin: "4px 0 0", fontSize: 13, color: "#8895A7" }}>Mauritius GBC \u2014 Real-time pool status</p></div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
      <StatCard label="Total Pool Capital" value={fmt(POOL_STATS.totalCapital)} sub="USDC held by SPV" />
      <StatCard label="Deployed" value={fmt(POOL_STATS.deployed)} sub={`${((POOL_STATS.deployed/POOL_STATS.totalCapital)*100).toFixed(0)}% utilisation`} accent="#7B1FA2" />
      <StatCard label="Available" value={fmt(POOL_STATS.available)} sub="Ready for deployment" accent="#2E7D32" />
      <StatCard label="Active Trades" value={POOL_STATS.activeTrades} sub={`of ${POOL_STATS.totalTrades} total`} />
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
      <StatCard label="Avg Cycle Time" value={`${POOL_STATS.avgCycleTime} days`} sub="Funding to repayment" />
      <StatCard label="YTD Return" value={`${POOL_STATS.ytdReturn}%`} sub="Net of fees" accent="#2E7D32" />
      <StatCard label="Annualised Return" value={`${POOL_STATS.annualisedReturn}%`} sub="Projected at current velocity" accent="#2E7D32" />
    </div>
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#1B2A4A" }}>Pool Deployment</h3>
      <div style={{ height: 24, borderRadius: 12, background: "#F5F5F5", overflow: "hidden", position: "relative" }}><div style={{ height: "100%", borderRadius: 12, background: "linear-gradient(90deg, #7B1FA2, #1565C0)", width: `${(POOL_STATS.deployed/POOL_STATS.totalCapital)*100}%` }} /></div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#8895A7" }}><span>{fmt(POOL_STATS.deployed)} deployed</span><span>{fmt(POOL_STATS.available)} available</span></div>
    </div>
  </div>);
}

function TradesPage({ trades, onSelect, onNewTrade }) {
  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div><h2 style={{ margin: 0, fontSize: 22, color: "#1B2A4A", fontWeight: 700 }}>Trades</h2><p style={{ margin: "4px 0 0", fontSize: 13, color: "#8895A7" }}>All trade escrows</p></div>
      <button onClick={onNewTrade} style={{ padding: "10px 20px", background: "#1B2A4A", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ New Trade</button>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {trades.map(trade => (
        <div key={trade.id} onClick={() => onSelect(trade)} style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20, cursor: "pointer", transition: "border-color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#2E75B6"} onMouseLeave={e => e.currentTarget.style.borderColor = "#E8ECF0"}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div><div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}><span style={{ fontSize: 15, fontWeight: 700, color: "#1B2A4A" }}>{trade.id}</span><Badge state={trade.state} /></div><div style={{ fontSize: 13, color: "#8895A7" }}>{trade.commodity} \u2022 {trade.volume}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 700, color: "#1B2A4A" }}>{fmtFull(trade.totalAmount)}</div><div style={{ fontSize: 11, color: "#8895A7" }}>USDC</div></div>
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#8895A7", marginBottom: 14, flexWrap: "wrap" }}>
            <span><strong style={{ color: "#3D5A80" }}>Buyer:</strong> {trade.buyer}</span>
            <span><strong style={{ color: "#3D5A80" }}>Exporter:</strong> {trade.exporter}</span>
            <span><strong style={{ color: "#3D5A80" }}>Inspector:</strong> {trade.inspector}</span>
          </div>
          <FundingBar buyerMargin={trade.buyerMargin} poolCapital={trade.poolCapital} buyerDeposited={trade.state !== "Created" ? trade.buyerMargin : trade.buyerMargin * 0.4} poolDeposited={trade.state !== "Created" ? trade.poolCapital : 0} />
        </div>
      ))}
    </div>
  </div>);
}

function NewTradePage({ onBack, onSubmit, nextId }) {
  const [form, setForm] = useState({ buyer: "", buyerWallet: "", exporter: "", exporterWallet: "", commodity: "ULSD 10ppm", customCommodity: "", volume: "", volumeUnit: "MT", totalAmount: "", marginPct: "25", inspector: "SGS", tradeTerms: "CIF", port: "", tenor: "30", yieldRate: "1.75", platformFee: "1.25", notes: "" });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const totalNum = parseFloat(form.totalAmount) || 0;
  const marginPctNum = parseFloat(form.marginPct) || 0;
  const buyerMargin = Math.round(totalNum * (marginPctNum / 100));
  const poolCapital = totalNum - buyerMargin;
  const tenorNum = parseInt(form.tenor) || 30;
  const yieldNum = parseFloat(form.yieldRate) || 0;
  const feeNum = parseFloat(form.platformFee) || 0;
  const poolReturn = Math.round(poolCapital * (yieldNum / 100));
  const platformFeeAmt = Math.round(totalNum * (feeNum / 100));
  const buyerAllIn = marginPctNum > 0 ? ((yieldNum * (100 - marginPctNum) / 100) + feeNum).toFixed(2) : "0";
  const commodities = [{ value: "ULSD 10ppm", label: "ULSD 10ppm (Diesel)" },{ value: "AGO", label: "AGO (Automotive Gas Oil)" },{ value: "PMS", label: "PMS (Gasoline/Petrol)" },{ value: "JET A-1", label: "JET A-1 (Aviation Fuel)" },{ value: "DPK", label: "DPK (Dual Purpose Kerosene)" },{ value: "LPG", label: "LPG (Liquefied Petroleum Gas)" },{ value: "Crude Oil", label: "Crude Oil" },{ value: "Palm Oil", label: "Palm Oil (Edible)" },{ value: "Soybean Oil", label: "Soybean Oil" },{ value: "Urea", label: "Urea (Fertiliser)" },{ value: "DAP", label: "DAP (Fertiliser)" },{ value: "Rice", label: "Rice" },{ value: "Wheat", label: "Wheat" },{ value: "Sugar", label: "Sugar (ICUMSA 45)" },{ value: "Cement", label: "Cement" },{ value: "Other", label: "Other (specify)" }];
  const inspectors = [{ value: "SGS", label: "SGS" },{ value: "Bureau Veritas", label: "Bureau Veritas" },{ value: "Intertek", label: "Intertek" },{ value: "Cotecna", label: "Cotecna" },{ value: "AmSpec", label: "AmSpec" }];
  const terms = [{ value: "CIF", label: "CIF" },{ value: "CFR", label: "CFR" },{ value: "FOB", label: "FOB" },{ value: "DAP", label: "DAP" },{ value: "DDP", label: "DDP" }];
  const isValid = form.buyer && form.exporter && form.buyerWallet && form.exporterWallet && totalNum > 0 && form.volume && form.port;
  const handleSubmit = () => {
    if (!isValid) return;
    const commodity = form.commodity === "Other" ? form.customCommodity : form.commodity;
    onSubmit({ id: nextId, state: "Created", buyer: form.buyer, buyerWallet: form.buyerWallet, exporter: form.exporter, exporterWallet: form.exporterWallet, commodity, volume: `${Number(form.volume).toLocaleString()} ${form.volumeUnit}`, totalAmount: totalNum, buyerMargin, poolCapital, marginPct: marginPctNum, escrowAddress: "Pending deployment", createdAt: todayStr(), fundedAt: null, shippedAt: null, inspectedAt: null, releasedAt: null, expiresAt: futureStr(tenorNum), repaymentStatus: "N/A", repaymentReceived: 0, inspector: form.inspector, tradeTerms: `${form.tradeTerms} ${form.port}`, tenor: tenorNum, yieldRate: yieldNum, platformFee: feeNum, notes: form.notes });
  };

  return (<div>
    <button onClick={onBack} style={{ background: "none", border: "none", color: "#2E75B6", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 16, fontWeight: 600 }}>&larr; Back to trades</button>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div><h2 style={{ margin: 0, fontSize: 22, color: "#1B2A4A", fontWeight: 700 }}>New Trade</h2><p style={{ margin: "4px 0 0", fontSize: 13, color: "#8895A7" }}>Originate a new trade escrow \u2022 {nextId}</p></div>
    </div>
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Counterparties</h3>
          <FormField label="Buyer (OMC / Importer)"><Input value={form.buyer} onChange={set("buyer")} placeholder="e.g. Zenith Petroleum Ltd" /></FormField>
          <FormField label="Buyer Wallet Address" sub="EVM address for margin deposit"><Input value={form.buyerWallet} onChange={set("buyerWallet")} placeholder="0x..." /></FormField>
          <FormField label="Exporter"><Input value={form.exporter} onChange={set("exporter")} placeholder="e.g. Vitol SA" /></FormField>
          <FormField label="Exporter Wallet Address" sub="EVM address for settlement payout"><Input value={form.exporterWallet} onChange={set("exporterWallet")} placeholder="0x..." /></FormField>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Cargo Details</h3>
          <FormField label="Commodity"><Select value={form.commodity} onChange={set("commodity")} options={commodities} /></FormField>
          {form.commodity === "Other" && <FormField label="Specify Commodity"><Input value={form.customCommodity} onChange={set("customCommodity")} placeholder="Describe the commodity" /></FormField>}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 3 }}><FormField label="Volume"><Input value={form.volume} onChange={set("volume")} placeholder="e.g. 30000" type="number" /></FormField></div>
            <div style={{ flex: 1 }}><FormField label="Unit"><Select value={form.volumeUnit} onChange={set("volumeUnit")} options={[{ value: "MT", label: "MT" },{ value: "BBL", label: "BBL" },{ value: "CBM", label: "CBM" },{ value: "KG", label: "KG" }]} /></FormField></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><FormField label="Trade Terms"><Select value={form.tradeTerms} onChange={set("tradeTerms")} options={terms} /></FormField></div>
            <div style={{ flex: 2 }}><FormField label="Destination Port"><Input value={form.port} onChange={set("port")} placeholder="e.g. Lagos, Apapa" /></FormField></div>
          </div>
          <FormField label="Independent Inspector"><Select value={form.inspector} onChange={set("inspector")} options={inspectors} /></FormField>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Financial Terms</h3>
          <FormField label="Total Trade Value" sub="USDC"><Input value={form.totalAmount} onChange={set("totalAmount")} placeholder="e.g. 10000000" type="number" prefix="$" /></FormField>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><FormField label="Buyer Margin" sub="% of total"><Input value={form.marginPct} onChange={set("marginPct")} type="number" prefix="%" /></FormField></div>
            <div style={{ flex: 1 }}><FormField label="Trade Tenor" sub="days"><Input value={form.tenor} onChange={set("tenor")} type="number" prefix="D" /></FormField></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><FormField label="Pool Yield Rate" sub="% per cycle"><Input value={form.yieldRate} onChange={set("yieldRate")} type="number" prefix="%" /></FormField></div>
            <div style={{ flex: 1 }}><FormField label="Platform Fee" sub="% of trade value"><Input value={form.platformFee} onChange={set("platformFee")} type="number" prefix="%" /></FormField></div>
          </div>
          <FormField label="Notes" sub="optional"><textarea value={form.notes} onChange={e => set("notes")(e.target.value)} placeholder="Any additional notes..." rows={3} style={{ width: "100%", padding: "10px 14px", border: "1px solid #D0D7DE", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", color: "#1B2A4A" }} /></FormField>
        </div>
      </div>
      <div style={{ flex: "0 1 340px" }}>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20, position: "sticky", top: 28 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Trade Summary</h3>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#1B2A4A", marginBottom: 4 }}>{totalNum > 0 ? fmtFull(totalNum) : "$\u2014"}</div>
          <div style={{ fontSize: 12, color: "#8895A7", marginBottom: 20 }}>Total escrow value (USDC)</div>
          {totalNum > 0 && (<>
            <FundingBar buyerMargin={buyerMargin} poolCapital={poolCapital} buyerDeposited={0} poolDeposited={0} />
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 10, color: "#8895A7", fontWeight: 600 }}>BUYER MARGIN</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1565C0" }}>{fmtFull(buyerMargin)}</div>
                <div style={{ fontSize: 11, color: "#8895A7" }}>{marginPctNum}%</div>
              </div>
              <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 10, color: "#8895A7", fontWeight: 600 }}>POOL CAPITAL</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#7B1FA2" }}>{fmtFull(poolCapital)}</div>
                <div style={{ fontSize: 11, color: "#8895A7" }}>{100 - marginPctNum}%</div>
              </div>
            </div>
            <div style={{ marginTop: 16, borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#8895A7", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Economics</div>
              {[["Pool yield", `${fmtFull(poolReturn)} (${yieldNum}%)`],["Platform fee", `${fmtFull(platformFeeAmt)} (${feeNum}%)`],["Buyer all-in cost", `~${buyerAllIn}%`],["Tenor", `${tenorNum} days`],["Expiry", futureStr(tenorNum)]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}><span style={{ color: "#8895A7" }}>{l}</span><span style={{ color: "#1B2A4A", fontWeight: 600 }}>{v}</span></div>
              ))}
            </div>
          </>)}
          <button onClick={handleSubmit} disabled={!isValid} style={{ width: "100%", padding: 14, marginTop: 20, background: isValid ? "#1B2A4A" : "#D0D7DE", color: isValid ? "#fff" : "#8895A7", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: isValid ? "pointer" : "not-allowed" }}>Create Trade Escrow</button>
          {!isValid && <div style={{ fontSize: 11, color: "#8895A7", textAlign: "center", marginTop: 8 }}>Fill in all required fields to create</div>}
        </div>
      </div>
    </div>
  </div>);
}

function TradeDetailPage({ trade, onBack, wallet, onConnect }) {
  const steps = [
    { label: "Escrow Created", date: trade.createdAt, done: true },
    { label: "Fully Funded", date: trade.fundedAt, done: !!trade.fundedAt },
    { label: "Cargo Shipped", date: trade.shippedAt, done: !!trade.shippedAt, active: trade.state === "Funded" && !trade.shippedAt },
    { label: "Inspection Passed", date: trade.inspectedAt, done: !!trade.inspectedAt, active: !!trade.shippedAt && !trade.inspectedAt },
    { label: "Exporter Paid", date: trade.releasedAt, done: !!trade.releasedAt, active: !!trade.inspectedAt && !trade.releasedAt },
    { label: "Repayment Complete", date: trade.repaymentStatus === "Completed" ? "2026-03-08" : null, done: trade.repaymentStatus === "Completed" },
  ];
  return (<div>
    <button onClick={onBack} style={{ background: "none", border: "none", color: "#2E75B6", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 16, fontWeight: 600 }}>&larr; Back to trades</button>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
      <div><div style={{ display: "flex", alignItems: "center", gap: 12 }}><h2 style={{ margin: 0, fontSize: 22, color: "#1B2A4A" }}>{trade.id}</h2><Badge state={trade.state} /></div><p style={{ margin: "4px 0 0", fontSize: 13, color: "#8895A7" }}>{trade.commodity} \u2022 {trade.volume}</p></div>
      <div style={{ textAlign: "right" }}><div style={{ fontSize: 28, fontWeight: 700, color: "#1B2A4A" }}>{fmtFull(trade.totalAmount)}</div><div style={{ fontSize: 12, color: "#8895A7" }}>Total Escrow (USDC)</div></div>
    </div>
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Parties</h3>
          {[["Buyer", trade.buyer, trade.buyerWallet],["Exporter", trade.exporter, trade.exporterWallet],["Inspector", trade.inspector, null]].map(([role, name, wallet]) => (
            <div key={role} style={{ marginBottom: 10 }}><div style={{ fontSize: 11, color: "#8895A7", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{role}</div><div style={{ fontSize: 14, color: "#1B2A4A", fontWeight: 600 }}>{name}</div>{wallet && <div style={{ fontSize: 11, color: "#2E75B6", fontFamily: "monospace" }}>{wallet}</div>}</div>
          ))}
        </div>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Funding Structure</h3>
          <FundingBar buyerMargin={trade.buyerMargin} poolCapital={trade.poolCapital} buyerDeposited={trade.state !== "Created" ? trade.buyerMargin : 0} poolDeposited={trade.state !== "Created" ? trade.poolCapital : 0} />
          <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 8, padding: 12, minWidth: 120 }}><div style={{ fontSize: 11, color: "#8895A7", fontWeight: 600 }}>BUYER MARGIN</div><div style={{ fontSize: 18, fontWeight: 700, color: "#1565C0" }}>{fmtFull(trade.buyerMargin)}</div><div style={{ fontSize: 11, color: "#8895A7" }}>{((trade.buyerMargin/trade.totalAmount)*100).toFixed(0)}% of total</div></div>
            <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 8, padding: 12, minWidth: 120 }}><div style={{ fontSize: 11, color: "#8895A7", fontWeight: 600 }}>POOL CAPITAL</div><div style={{ fontSize: 18, fontWeight: 700, color: "#7B1FA2" }}>{fmtFull(trade.poolCapital)}</div><div style={{ fontSize: 11, color: "#8895A7" }}>{((trade.poolCapital/trade.totalAmount)*100).toFixed(0)}% leverage</div></div>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Smart Contract</h3>
          <div style={{ fontFamily: "monospace", fontSize: 13, color: "#2E75B6", wordBreak: "break-all", background: "#F8FAFC", padding: 10, borderRadius: 6, marginBottom: 10 }}>{trade.escrowAddress}</div>
          <div style={{ fontSize: 12, color: "#8895A7" }}>{trade.escrowAddress === "Pending deployment" ? "Awaiting escrow deployment" : `Deployed on Arbitrum \u2022 Expires ${trade.expiresAt}`}</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Cargo Details</h3>
          {[
            ["Commodity", trade.commodity],
            ["Volume", trade.volume],
            ["Trade Terms", trade.tradeTerms || "\u2014"],
            ["Expiry Date", trade.expiresAt],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
              <span style={{ fontSize: 13, color: "#8895A7" }}>{l}</span>
              <span style={{ fontSize: 13, color: "#1B2A4A", fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Financial Terms</h3>
          {[
            ["Total Value", fmtFull(trade.totalAmount) + " USDC"],
            ["Buyer Margin", `${((trade.buyerMargin/trade.totalAmount)*100).toFixed(0)}% (${fmtFull(trade.buyerMargin)})`],
            ["Pool Capital", `${((trade.poolCapital/trade.totalAmount)*100).toFixed(0)}% (${fmtFull(trade.poolCapital)})`],
            ["Tenor", `${trade.tenor || "\u2014"} days`],
            ["Pool Yield Rate", trade.yieldRate ? `${trade.yieldRate}% per cycle` : "\u2014"],
            ["Platform Fee", trade.platformFee ? `${trade.platformFee}%` : "\u2014"],
            ["Buyer All-In Cost", trade.yieldRate && trade.platformFee ? `~${((trade.yieldRate * (100 - ((trade.buyerMargin/trade.totalAmount)*100)) / 100) + trade.platformFee).toFixed(2)}%` : "\u2014"],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
              <span style={{ fontSize: 13, color: "#8895A7" }}>{l}</span>
              <span style={{ fontSize: 13, color: "#1B2A4A", fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          {trade.notes && (
            <div style={{ marginTop: 12, padding: 12, background: "#F8FAFC", borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: "#8895A7", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 13, color: "#1B2A4A", lineHeight: 1.5 }}>{trade.notes}</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Trade Lifecycle</h3>
          {steps.map((s, i) => <TimelineStep key={i} label={s.label} date={s.date} done={s.done} active={s.active} />)}
        </div>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Waterfall Repayment</h3>
          {trade.repaymentStatus === "Completed" ? (
            <div>{[["Pool principal + yield", fmtFull(7612500), "#2E7D32"],["Platform fee", fmtFull(125000), "#1B2A4A"],["Inspection + costs", fmtFull(12500), "#1B2A4A"],["Buyer residual", fmtFull(2400000), "#1B2A4A"]].map(([l, v, c]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}><span style={{ fontSize: 13, color: "#8895A7" }}>{l}</span><span style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</span></div>
            ))}</div>
          ) : (<div style={{ fontSize: 13, color: "#8895A7", textAlign: "center", padding: 20 }}>{trade.state === "Released" ? "Awaiting downstream sales proceeds" : "Settlement not yet triggered"}</div>)}
        </div>
        {trade.state === "Funded" && (
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Actions</h3>
            {wallet ? (<>
              <div style={{ fontSize: 11, color: "#8895A7", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#81C784", display: "inline-block" }} />
                Connected: <span style={{ fontFamily: "monospace", color: "#2E75B6" }}>{shortAddr(wallet)}</span>
              </div>
              <button style={{ width: "100%", padding: 12, background: "#2E7D32", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Upload Inspection Certificate</button>
              <button onClick={() => alert("This will call release() on the escrow contract via your multisig. Requires inspection certificate verification.")} style={{ width: "100%", padding: 12, background: "#1565C0", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Trigger Release (Multisig)</button>
            </>) : (
              <button onClick={onConnect} style={{ width: "100%", padding: 12, background: "#64B5F6", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Connect Wallet for Actions</button>
            )}
            <button style={{ width: "100%", padding: 12, background: "#fff", color: "#C62828", border: "1px solid #E57373", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel Trade</button>
          </div>
        )}
        {trade.state === "Created" && (
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Actions</h3>
            {wallet ? (<>
              <div style={{ fontSize: 11, color: "#8895A7", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#81C784", display: "inline-block" }} />
                Connected: <span style={{ fontFamily: "monospace", color: "#2E75B6" }}>{shortAddr(wallet)}</span>
              </div>
              <button onClick={() => alert("This will deploy a TradeEscrow contract via the factory. Connect to Arbitrum Sepolia and ensure you have test ETH.")} style={{ width: "100%", padding: 12, background: "#1B2A4A", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Deploy Escrow Contract</button>
            </>) : (
              <button onClick={onConnect} style={{ width: "100%", padding: 12, background: "#64B5F6", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Connect Wallet to Deploy</button>
            )}
            <button style={{ width: "100%", padding: 12, background: "#fff", color: "#C62828", border: "1px solid #E57373", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel Trade</button>
          </div>
        )}
      </div>
    </div>
  </div>);
}

function VerifyPage() {
  const [contractAddr, setContractAddr] = useState("");
  const [verified, setVerified] = useState(null);
  const handleVerify = () => { setVerified({ tradeId: "TRD-2026-0002", state: "Funded", totalLocked: 8500000, exporter: "Trafigura Pte", exporterWallet: "0x3cB2...e8f1", buyerMargin: 2125000, poolCapital: 6375000, expires: "2026-03-25", chain: "Arbitrum One", fundedAt: "2026-03-02 14:32 UTC" }); };
  return (<div>
    <div style={{ marginBottom: 24 }}><h2 style={{ margin: 0, fontSize: 22, color: "#1B2A4A", fontWeight: 700 }}>Exporter Verification</h2><p style={{ margin: "4px 0 0", fontSize: 13, color: "#8895A7" }}>Independently verify that trade escrow funds are locked on-chain</p></div>
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 24, maxWidth: 600, marginBottom: 20 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#3D5A80", display: "block", marginBottom: 6 }}>Escrow Contract Address</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="text" value={contractAddr} onChange={e => setContractAddr(e.target.value)} placeholder="0x..." style={{ flex: 1, padding: "10px 14px", border: "1px solid #D0D7DE", borderRadius: 8, fontSize: 14, fontFamily: "monospace", outline: "none" }} />
        <button onClick={handleVerify} style={{ padding: "10px 20px", background: "#1B2A4A", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Verify</button>
      </div>
    </div>
    {verified && (<div style={{ background: "#fff", borderRadius: 10, border: "2px solid #81C784", padding: 24, maxWidth: 600 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#2E7D32" }}>{"\u2713"}</div>
        <div><div style={{ fontSize: 16, fontWeight: 700, color: "#2E7D32" }}>Escrow Verified &mdash; Funds Locked</div><div style={{ fontSize: 12, color: "#8895A7" }}>Verified on {verified.chain} at {verified.fundedAt}</div></div>
      </div>
      {[["Trade ID", verified.tradeId],["Status", verified.state],["Total Locked", fmtFull(verified.totalLocked) + " USDC"],["Buyer Margin", fmtFull(verified.buyerMargin) + " USDC"],["Pool Capital", fmtFull(verified.poolCapital) + " USDC"],["Designated Exporter", verified.exporter],["Exporter Wallet", verified.exporterWallet],["Expires", verified.expires]].map(([l, v]) => (
        <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}><span style={{ fontSize: 13, color: "#8895A7", fontWeight: 600 }}>{l}</span><span style={{ fontSize: 13, color: "#1B2A4A", fontWeight: 600, fontFamily: l.includes("Wallet") ? "monospace" : "inherit" }}>{v}</span></div>
      ))}
      <div style={{ marginTop: 16, padding: 14, background: "#F1F8E9", borderRadius: 8, fontSize: 13, color: "#33691E", lineHeight: 1.5 }}>This escrow contract holds {fmtFull(verified.totalLocked)} USDC, locked and payable exclusively to the designated exporter wallet upon verified compliance. Funds cannot be withdrawn by any other party prior to the expiry date.</div>
    </div>)}
  </div>);
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [trades, setTrades] = useState(INITIAL_TRADES);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showNewTrade, setShowNewTrade] = useState(false);

  // Wallet state
  const [wallet, setWallet] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const chain = chainId ? CHAINS[chainId] || { name: `Chain ${parseInt(chainId, 16)}`, color: "#E0E0E0", testnet: false } : null;

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) { alert("Please install MetaMask to connect your wallet."); return; }
    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const cid = await window.ethereum.request({ method: "eth_chainId" });
      setWallet(accounts[0]);
      setChainId(cid);
    } catch (e) { console.error("Wallet connection failed:", e); }
    setConnecting(false);
  }, []);

  const disconnectWallet = () => { setWallet(null); setChainId(null); };

  const switchToArbSepolia = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARB_SEPOLIA_ID }] });
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: ARB_SEPOLIA_ID, chainName: "Arbitrum Sepolia", nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }, rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"], blockExplorerUrls: ["https://sepolia.arbiscan.io"] }] });
      }
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccounts = (accs) => { if (accs.length === 0) disconnectWallet(); else setWallet(accs[0]); };
    const handleChain = (cid) => setChainId(cid);
    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);
    // Auto-reconnect if previously connected
    window.ethereum.request({ method: "eth_accounts" }).then(accs => {
      if (accs.length > 0) { setWallet(accs[0]); window.ethereum.request({ method: "eth_chainId" }).then(setChainId); }
    });
    return () => { window.ethereum.removeListener("accountsChanged", handleAccounts); window.ethereum.removeListener("chainChanged", handleChain); };
  }, []);
  const nextTradeId = `TRD-2026-${String(trades.length + 1).padStart(4, "0")}`;
  const handleNewTradeSubmit = (trade) => { setTrades([trade, ...trades]); setShowNewTrade(false); setSelectedTrade(trade); };
  const nav = [{ id: "dashboard", label: "Dashboard", icon: "\u25A0" },{ id: "trades", label: "Trades", icon: "\u21C4" },{ id: "verify", label: "Verify", icon: "\u2713" }];

  const renderPage = () => {
    if (page === "trades" && showNewTrade) return <NewTradePage onBack={() => setShowNewTrade(false)} onSubmit={handleNewTradeSubmit} nextId={nextTradeId} />;
    if (page === "trades" && selectedTrade) return <TradeDetailPage trade={selectedTrade} onBack={() => setSelectedTrade(null)} wallet={wallet} onConnect={connectWallet} />;
    switch (page) {
      case "dashboard": return <DashboardPage />;
      case "trades": return <TradesPage trades={trades} onSelect={t => setSelectedTrade(t)} onNewTrade={() => { setShowNewTrade(true); setSelectedTrade(null); }} />;
      case "verify": return <VerifyPage />;
      default: return <DashboardPage />;
    }
  };

  return (<div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", background: "#F4F6F9" }}>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <div style={{ width: 220, background: "#1B2A4A", padding: "24px 0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: -0.5, fontFamily: "'Georgia', serif" }}>Rheon.</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>Settlement Platform</div>
      </div>
      <div style={{ marginTop: 16 }}>
        {nav.map(n => (<div key={n.id} onClick={() => { setPage(n.id); setSelectedTrade(null); setShowNewTrade(false); }} style={{ padding: "12px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: page === n.id ? "rgba(255,255,255,0.1)" : "transparent", borderLeft: page === n.id ? "3px solid #64B5F6" : "3px solid transparent", transition: "all 0.15s" }}>
          <span style={{ fontSize: 14, color: page === n.id ? "#fff" : "rgba(255,255,255,0.5)" }}>{n.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: page === n.id ? "#fff" : "rgba(255,255,255,0.5)" }}>{n.label}</span>
        </div>))}
      </div>
      <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        {wallet ? (<>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 0.5 }}>NETWORK</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: chain?.color || "#E0E0E0", display: "inline-block" }} />
            {chain?.name || "Unknown"}
          </div>
          {chain?.testnet && chainId !== ARB_SEPOLIA_ID && (
            <button onClick={switchToArbSepolia} style={{ marginTop: 6, padding: "4px 8px", fontSize: 10, background: "rgba(255,183,77,0.2)", color: "#FFB74D", border: "1px solid rgba(255,183,77,0.3)", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>Switch to Arb Sepolia</button>
          )}
          {chainId !== ARB_SEPOLIA_ID && !chain?.testnet && (
            <button onClick={switchToArbSepolia} style={{ marginTop: 6, padding: "4px 8px", fontSize: 10, background: "rgba(255,183,77,0.2)", color: "#FFB74D", border: "1px solid rgba(255,183,77,0.3)", borderRadius: 4, cursor: "pointer", fontFamily: "inherit" }}>Switch to Arb Sepolia</button>
          )}
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 10, letterSpacing: 0.5 }}>CONNECTED WALLET</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 4, fontFamily: "monospace" }}>{shortAddr(wallet)}</div>
          <button onClick={disconnectWallet} style={{ marginTop: 8, padding: "6px 12px", fontSize: 11, background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>Disconnect</button>
        </>) : (
          <button onClick={connectWallet} disabled={connecting} style={{ width: "100%", padding: "10px 14px", background: connecting ? "rgba(255,255,255,0.05)" : "rgba(100,181,246,0.15)", color: connecting ? "rgba(255,255,255,0.4)" : "#64B5F6", border: "1px solid rgba(100,181,246,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: connecting ? "wait" : "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </div>
    <div style={{ flex: 1, padding: 28, overflowY: "auto", maxHeight: "100vh" }}>{renderPage()}</div>
  </div>);
}

