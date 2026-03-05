import { useState, useEffect } from "react";

// ============================================================
// MOCK DATA - Replace with real blockchain + API calls
// ============================================================
const MOCK_TRADES = [
  {
    id: "TRD-2026-0001",
    state: "Released",
    buyer: "Zenith Petroleum Ltd",
    buyerWallet: "0x7a3B...f9c2",
    exporter: "Vitol SA",
    exporterWallet: "0x4eD8...a1b3",
    commodity: "ULSD 10ppm",
    volume: "30,000 MT",
    totalAmount: 10000000,
    buyerMargin: 2500000,
    poolCapital: 7500000,
    escrowAddress: "0x1234...abcd",
    createdAt: "2026-02-18",
    fundedAt: "2026-02-18",
    shippedAt: "2026-02-22",
    inspectedAt: "2026-03-01",
    releasedAt: "2026-03-01",
    expiresAt: "2026-03-20",
    repaymentStatus: "Completed",
    repaymentReceived: 10150000,
    inspector: "SGS",
  },
  {
    id: "TRD-2026-0002",
    state: "Funded",
    buyer: "Oando Energy",
    buyerWallet: "0x9fA1...d4e7",
    exporter: "Trafigura Pte",
    exporterWallet: "0x3cB2...e8f1",
    commodity: "PMS (Gasoline)",
    volume: "25,000 MT",
    totalAmount: 8500000,
    buyerMargin: 2125000,
    poolCapital: 6375000,
    escrowAddress: "0x5678...ef01",
    createdAt: "2026-03-02",
    fundedAt: "2026-03-02",
    shippedAt: null,
    inspectedAt: null,
    releasedAt: null,
    expiresAt: "2026-03-25",
    repaymentStatus: "Pending",
    repaymentReceived: 0,
    inspector: "Bureau Veritas",
  },
  {
    id: "TRD-2026-0003",
    state: "Created",
    buyer: "MRS Oil & Gas",
    buyerWallet: "0x2dE3...b5a9",
    exporter: "Mercuria Energy",
    exporterWallet: "0x8aF4...c2d6",
    commodity: "AGO (Diesel)",
    volume: "20,000 MT",
    totalAmount: 7200000,
    buyerMargin: 1800000,
    poolCapital: 5400000,
    escrowAddress: "0x9abc...2345",
    createdAt: "2026-03-05",
    fundedAt: null,
    shippedAt: null,
    inspectedAt: null,
    releasedAt: null,
    expiresAt: "2026-03-30",
    repaymentStatus: "N/A",
    repaymentReceived: 0,
    inspector: "Intertek",
  },
];

const POOL_STATS = {
  totalCapital: 15000000,
  deployed: 13875000,
  available: 1125000,
  totalTrades: 47,
  activeTrades: 2,
  avgCycleTime: 14.2,
  ytdReturn: 8.7,
  annualisedReturn: 26.1,
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const fmt = (n) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
};

const fmtFull = (n) => `$${n.toLocaleString("en-US")}`;

const stateColor = {
  Created: { bg: "#FFF3E0", text: "#E65100", border: "#FFB74D" },
  Funded: { bg: "#E3F2FD", text: "#1565C0", border: "#64B5F6" },
  Released: { bg: "#E8F5E9", text: "#2E7D32", border: "#81C784" },
  Expired: { bg: "#FFEBEE", text: "#C62828", border: "#E57373" },
  Cancelled: { bg: "#F5F5F5", text: "#616161", border: "#BDBDBD" },
};

// ============================================================
// COMPONENTS
// ============================================================

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "18px 20px",
      border: "1px solid #E8ECF0", flex: "1 1 180px", minWidth: 160,
    }}>
      <div style={{ fontSize: 12, color: "#8895A7", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent || "#1B2A4A", lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#8895A7", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Badge({ state }) {
  const c = stateColor[state] || stateColor.Created;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>{state.toUpperCase()}</span>
  );
}

function TimelineStep({ label, date, done, active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        background: done ? "#2E7D32" : active ? "#1565C0" : "#E0E0E0",
        color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>
        {done ? "\u2713" : active ? "\u2022" : ""}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: done ? "#2E7D32" : active ? "#1565C0" : "#999" }}>{label}</div>
      </div>
      <div style={{ fontSize: 12, color: "#8895A7", minWidth: 80, textAlign: "right" }}>
        {date || "\u2014"}
      </div>
    </div>
  );
}

function FundingBar({ buyerMargin, poolCapital, buyerDeposited, poolDeposited }) {
  const total = buyerMargin + poolCapital;
  const buyerPct = (buyerMargin / total) * 100;
  const poolPct = (poolCapital / total) * 100;
  const buyerFillPct = buyerMargin > 0 ? ((buyerDeposited || buyerMargin) / buyerMargin) * buyerPct : 0;
  const poolFillPct = poolCapital > 0 ? ((poolDeposited || poolCapital) / poolCapital) * poolPct : 0;

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        <div style={{ height: 8, borderRadius: 4, background: "#E3F2FD", flex: buyerPct, position: "relative", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, background: "#1565C0", width: `${(buyerFillPct / buyerPct) * 100}%`, transition: "width 0.3s" }} />
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "#F3E5F5", flex: poolPct, position: "relative", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, background: "#7B1FA2", width: `${(poolFillPct / poolPct) * 100}%`, transition: "width 0.3s" }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8895A7" }}>
        <span><span style={{ color: "#1565C0", fontWeight: 600 }}>Buyer margin</span> {fmt(buyerMargin)}</span>
        <span><span style={{ color: "#7B1FA2", fontWeight: 600 }}>Pool capital</span> {fmt(poolCapital)}</span>
      </div>
    </div>
  );
}

// ============================================================
// PAGES
// ============================================================

function DashboardPage() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: "#1B2A4A", fontWeight: 700 }}>Capital Pool Overview</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8895A7" }}>Mauritius GBC \u2014 Real-time pool status</p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        <StatCard label="Total Pool Capital" value={fmt(POOL_STATS.totalCapital)} sub="USDC held by SPV" />
        <StatCard label="Deployed" value={fmt(POOL_STATS.deployed)} sub={`${((POOL_STATS.deployed / POOL_STATS.totalCapital) * 100).toFixed(0)}% utilisation`} accent="#7B1FA2" />
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
        <div style={{ height: 24, borderRadius: 12, background: "#F5F5F5", overflow: "hidden", position: "relative" }}>
          <div style={{
            height: "100%", borderRadius: 12,
            background: "linear-gradient(90deg, #7B1FA2, #1565C0)",
            width: `${(POOL_STATS.deployed / POOL_STATS.totalCapital) * 100}%`,
            transition: "width 0.5s",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#8895A7" }}>
          <span>{fmt(POOL_STATS.deployed)} deployed</span>
          <span>{fmt(POOL_STATS.available)} available</span>
        </div>
      </div>
    </div>
  );
}

function TradesPage({ onSelect }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#1B2A4A", fontWeight: 700 }}>Trades</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8895A7" }}>All trade escrows</p>
        </div>
        <button style={{
          padding: "10px 20px", background: "#1B2A4A", color: "#fff", border: "none",
          borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>+ New Trade</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MOCK_TRADES.map(trade => (
          <div key={trade.id} onClick={() => onSelect(trade)} style={{
            background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0",
            padding: 20, cursor: "pointer", transition: "border-color 0.2s",
          }} onMouseEnter={e => e.currentTarget.style.borderColor = "#2E75B6"}
             onMouseLeave={e => e.currentTarget.style.borderColor = "#E8ECF0"}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#1B2A4A" }}>{trade.id}</span>
                  <Badge state={trade.state} />
                </div>
                <div style={{ fontSize: 13, color: "#8895A7" }}>{trade.commodity} \u2022 {trade.volume}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1B2A4A" }}>{fmtFull(trade.totalAmount)}</div>
                <div style={{ fontSize: 11, color: "#8895A7" }}>USDC</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#8895A7", marginBottom: 14, flexWrap: "wrap" }}>
              <span><strong style={{ color: "#3D5A80" }}>Buyer:</strong> {trade.buyer}</span>
              <span><strong style={{ color: "#3D5A80" }}>Exporter:</strong> {trade.exporter}</span>
              <span><strong style={{ color: "#3D5A80" }}>Inspector:</strong> {trade.inspector}</span>
            </div>

            <FundingBar
              buyerMargin={trade.buyerMargin}
              poolCapital={trade.poolCapital}
              buyerDeposited={trade.state !== "Created" ? trade.buyerMargin : trade.buyerMargin * 0.4}
              poolDeposited={trade.state !== "Created" ? trade.poolCapital : 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeDetailPage({ trade, onBack }) {
  const steps = [
    { label: "Escrow Created", date: trade.createdAt, done: true },
    { label: "Fully Funded", date: trade.fundedAt, done: !!trade.fundedAt },
    { label: "Cargo Shipped", date: trade.shippedAt, done: !!trade.shippedAt, active: trade.state === "Funded" && !trade.shippedAt },
    { label: "Inspection Passed", date: trade.inspectedAt, done: !!trade.inspectedAt, active: !!trade.shippedAt && !trade.inspectedAt },
    { label: "Exporter Paid", date: trade.releasedAt, done: !!trade.releasedAt, active: !!trade.inspectedAt && !trade.releasedAt },
    { label: "Repayment Complete", date: trade.repaymentStatus === "Completed" ? "2026-03-08" : null, done: trade.repaymentStatus === "Completed" },
  ];

  return (
    <div>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: "#2E75B6", fontSize: 13,
        cursor: "pointer", padding: 0, marginBottom: 16, fontWeight: 600,
      }}>&larr; Back to trades</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 22, color: "#1B2A4A" }}>{trade.id}</h2>
            <Badge state={trade.state} />
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8895A7" }}>{trade.commodity} \u2022 {trade.volume}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#1B2A4A" }}>{fmtFull(trade.totalAmount)}</div>
          <div style={{ fontSize: 12, color: "#8895A7" }}>Total Escrow (USDC)</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* Left: Details */}
        <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Parties */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Parties</h3>
            {[
              ["Buyer", trade.buyer, trade.buyerWallet],
              ["Exporter", trade.exporter, trade.exporterWallet],
              ["Inspector", trade.inspector, null],
            ].map(([role, name, wallet]) => (
              <div key={role} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#8895A7", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{role}</div>
                <div style={{ fontSize: 14, color: "#1B2A4A", fontWeight: 600 }}>{name}</div>
                {wallet && <div style={{ fontSize: 11, color: "#2E75B6", fontFamily: "monospace" }}>{wallet}</div>}
              </div>
            ))}
          </div>

          {/* Funding */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Funding Structure</h3>
            <FundingBar
              buyerMargin={trade.buyerMargin} poolCapital={trade.poolCapital}
              buyerDeposited={trade.state !== "Created" ? trade.buyerMargin : 0}
              poolDeposited={trade.state !== "Created" ? trade.poolCapital : 0}
            />
            <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 8, padding: 12, minWidth: 120 }}>
                <div style={{ fontSize: 11, color: "#8895A7", fontWeight: 600 }}>BUYER MARGIN</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1565C0" }}>{fmtFull(trade.buyerMargin)}</div>
                <div style={{ fontSize: 11, color: "#8895A7" }}>{((trade.buyerMargin / trade.totalAmount) * 100).toFixed(0)}% of total</div>
              </div>
              <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 8, padding: 12, minWidth: 120 }}>
                <div style={{ fontSize: 11, color: "#8895A7", fontWeight: 600 }}>POOL CAPITAL</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#7B1FA2" }}>{fmtFull(trade.poolCapital)}</div>
                <div style={{ fontSize: 11, color: "#8895A7" }}>{((trade.poolCapital / trade.totalAmount) * 100).toFixed(0)}% leverage</div>
              </div>
            </div>
          </div>

          {/* Escrow Contract */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Smart Contract</h3>
            <div style={{ fontFamily: "monospace", fontSize: 13, color: "#2E75B6", wordBreak: "break-all", background: "#F8FAFC", padding: 10, borderRadius: 6, marginBottom: 10 }}>
              {trade.escrowAddress}
            </div>
            <div style={{ fontSize: 12, color: "#8895A7" }}>
              Deployed on Arbitrum \u2022 Expires {trade.expiresAt}
            </div>
            <a href="#" style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: "#2E75B6", fontWeight: 600 }}>
              View on Arbiscan &rarr;
            </a>
          </div>
        </div>

        {/* Right: Timeline + Actions */}
        <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Timeline */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Trade Lifecycle</h3>
            {steps.map((s, i) => (
              <TimelineStep key={i} label={s.label} date={s.date} done={s.done} active={s.active} />
            ))}
          </div>

          {/* Repayment */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Waterfall Repayment</h3>
            {trade.repaymentStatus === "Completed" ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={{ fontSize: 13, color: "#8895A7" }}>Pool principal + yield</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#2E7D32" }}>{fmtFull(7612500)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={{ fontSize: 13, color: "#8895A7" }}>Platform fee</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1B2A4A" }}>{fmtFull(125000)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={{ fontSize: 13, color: "#8895A7" }}>Inspection + costs</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1B2A4A" }}>{fmtFull(12500)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                  <span style={{ fontSize: 13, color: "#8895A7" }}>Buyer residual</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1B2A4A" }}>{fmtFull(2400000)}</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#8895A7", textAlign: "center", padding: 20 }}>
                {trade.state === "Released" ? "Awaiting downstream sales proceeds" : "Settlement not yet triggered"}
              </div>
            )}
          </div>

          {/* Actions */}
          {trade.state === "Funded" && (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 20 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#1B2A4A", fontWeight: 700 }}>Actions</h3>
              <button style={{
                width: "100%", padding: 12, background: "#2E7D32", color: "#fff",
                border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8,
              }}>Upload Inspection Certificate</button>
              <button style={{
                width: "100%", padding: 12, background: "#1565C0", color: "#fff",
                border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8,
              }}>Trigger Release (Multisig)</button>
              <button style={{
                width: "100%", padding: 12, background: "#fff", color: "#C62828",
                border: "1px solid #E57373", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>Cancel Trade</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VerifyPage() {
  const [contractAddr, setContractAddr] = useState("");
  const [verified, setVerified] = useState(null);

  const handleVerify = () => {
    // Mock: pretend we found a funded escrow
    setVerified({
      tradeId: "TRD-2026-0002",
      state: "Funded",
      totalLocked: 8500000,
      exporter: "Trafigura Pte",
      exporterWallet: "0x3cB2...e8f1",
      buyerMargin: 2125000,
      poolCapital: 6375000,
      expires: "2026-03-25",
      chain: "Arbitrum One",
      fundedAt: "2026-03-02 14:32 UTC",
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: "#1B2A4A", fontWeight: 700 }}>Exporter Verification</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8895A7" }}>Independently verify that trade escrow funds are locked on-chain</p>
      </div>

      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8ECF0", padding: 24, maxWidth: 600, marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#3D5A80", display: "block", marginBottom: 6 }}>
          Escrow Contract Address
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text" value={contractAddr} onChange={e => setContractAddr(e.target.value)}
            placeholder="0x..."
            style={{
              flex: 1, padding: "10px 14px", border: "1px solid #D0D7DE", borderRadius: 8,
              fontSize: 14, fontFamily: "monospace", outline: "none",
            }}
          />
          <button onClick={handleVerify} style={{
            padding: "10px 20px", background: "#1B2A4A", color: "#fff", border: "none",
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
          }}>Verify</button>
        </div>
      </div>

      {verified && (
        <div style={{ background: "#fff", borderRadius: 10, border: "2px solid #81C784", padding: 24, maxWidth: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: "#E8F5E9",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: "#2E7D32",
            }}>{"\u2713"}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#2E7D32" }}>Escrow Verified &mdash; Funds Locked</div>
              <div style={{ fontSize: 12, color: "#8895A7" }}>Verified on {verified.chain} at {verified.fundedAt}</div>
            </div>
          </div>

          {[
            ["Trade ID", verified.tradeId],
            ["Status", verified.state],
            ["Total Locked", fmtFull(verified.totalLocked) + " USDC"],
            ["Buyer Margin", fmtFull(verified.buyerMargin) + " USDC"],
            ["Pool Capital", fmtFull(verified.poolCapital) + " USDC"],
            ["Designated Exporter", verified.exporter],
            ["Exporter Wallet", verified.exporterWallet],
            ["Expires", verified.expires],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", padding: "10px 0",
              borderBottom: "1px solid #f0f0f0",
            }}>
              <span style={{ fontSize: 13, color: "#8895A7", fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 13, color: "#1B2A4A", fontWeight: 600, fontFamily: label.includes("Wallet") ? "monospace" : "inherit" }}>{value}</span>
            </div>
          ))}

          <div style={{ marginTop: 16, padding: 14, background: "#F1F8E9", borderRadius: 8, fontSize: 13, color: "#33691E", lineHeight: 1.5 }}>
            This escrow contract holds {fmtFull(verified.totalLocked)} USDC, locked and payable exclusively to the designated exporter wallet upon verified compliance. Funds cannot be withdrawn by any other party prior to the expiry date. This verification is based on publicly auditable blockchain data.
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [selectedTrade, setSelectedTrade] = useState(null);

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "\u25A0" },
    { id: "trades", label: "Trades", icon: "\u21C4" },
    { id: "verify", label: "Verify", icon: "\u2713" },
  ];

  const renderPage = () => {
    if (page === "trades" && selectedTrade) {
      return <TradeDetailPage trade={selectedTrade} onBack={() => setSelectedTrade(null)} />;
    }
    switch (page) {
      case "dashboard": return <DashboardPage />;
      case "trades": return <TradesPage onSelect={(t) => setSelectedTrade(t)} />;
      case "verify": return <VerifyPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", background: "#F4F6F9" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <div style={{
        width: 220, background: "#1B2A4A", padding: "24px 0", display: "flex",
        flexDirection: "column", flexShrink: 0,
      }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: -0.5, fontFamily: "'Georgia', serif" }}>Rheon.</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>Settlement Platform</div>
        </div>

        <div style={{ marginTop: 16 }}>
          {nav.map(n => (
            <div key={n.id} onClick={() => { setPage(n.id); setSelectedTrade(null); }} style={{
              padding: "12px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              background: page === n.id ? "rgba(255,255,255,0.1)" : "transparent",
              borderLeft: page === n.id ? "3px solid #64B5F6" : "3px solid transparent",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 14, color: page === n.id ? "#fff" : "rgba(255,255,255,0.5)" }}>{n.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: page === n.id ? "#fff" : "rgba(255,255,255,0.5)" }}>{n.label}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 0.5 }}>NETWORK</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#81C784", display: "inline-block" }} />
            Arbitrum One
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 8, letterSpacing: 0.5 }}>SPV WALLET</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4, fontFamily: "monospace" }}>0xSPV...m4ur</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 28, overflowY: "auto", maxHeight: "100vh" }}>
        {renderPage()}
      </div>
    </div>
  );
}
