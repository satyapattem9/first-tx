// Right-hand column: wallet balance, progress, words learned, onchain receipts.

import { shortAddress } from '../lib/solana';

export default function Sidebar({ wallet, balance, doneCount, total, words, learned, newest, receipts }) {
  return (
    <aside className="sidebar">
      <div className="panel wallet-card">
        <div className="panel-label">PRACTICE WALLET · DEVNET</div>
        <div className="wallet-balance">
          {wallet && balance !== null ? balance.toFixed(3) : '—'}<span>SOL</span>
        </div>
        <div className="wallet-address">{wallet ? shortAddress(wallet) : 'Not connected'}</div>
      </div>

      <div className="panel">
        <div className="panel-label">PROGRESS</div>
        <div className="progress-bar">
          <div style={{ width: `${(doneCount / total) * 100}%` }} />
        </div>
        <div className="stat-row"><span>Lessons verified onchain</span><strong>{doneCount} / {total}</strong></div>
        <div className="stat-row"><span>Real money at risk</span><strong className="good">$0</strong></div>
      </div>

      <div className="panel">
        <div className="panel-label">WORDS YOU KNOW</div>
        <ul className="word-list">
          {words.map((w) => {
            const state = newest.includes(w) ? 'new' : learned.includes(w) ? 'on' : '';
            return (
              <li key={w} className={state}>
                <span className="word-dot" aria-hidden="true">{state ? '✓' : ''}</span>
                {w}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="panel">
        <div className="panel-label">ONCHAIN RECEIPTS</div>
        {receipts.length === 0 ? (
          <p className="muted">Your transactions show up here, each one linked to the devnet explorer.</p>
        ) : (
          <ul className="receipt-list">
            {receipts.map((r) => (
              <li key={r.signature}>
                <span className={r.ok ? 'badge ok' : 'badge bad'} aria-hidden="true">{r.ok ? '✓' : '!'}</span>
                <div className="receipt-body">
                  <div className="receipt-title">{r.title}</div>
                  <a href={`https://explorer.solana.com/tx/${r.signature}?cluster=devnet`} target="_blank" rel="noreferrer">
                    {shortAddress(r.signature)}
                  </a>
                </div>
                <span className={r.ok ? 'receipt-verdict ok' : 'receipt-verdict bad'}>{r.verdict}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}