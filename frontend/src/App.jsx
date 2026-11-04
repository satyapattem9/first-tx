import { useEffect, useState } from 'react';

import DevnetBanner from './components/DevnetBanner.jsx';
import Sidebar from './components/Sidebar.jsx';
import Lesson1Connect from './lessons/Lesson1Connect.jsx';
import Lesson2FirstSend from './lessons/Lesson2FirstSend.jsx';
import Lesson3ScamTrap from './lessons/Lesson3ScamTrap.jsx';
import { lessons } from './lib/lessons.js';
import { getBalanceLamports, lamportsToSol } from './lib/solana';

const SCREENS = {
  'lesson-1-connect': Lesson1Connect,
  'lesson-2-first-send': Lesson2FirstSend,
  'lesson-3-scam-trap': Lesson3ScamTrap,
};

// Add ?unlock to the URL to open every lesson (backup for live demos)
const DEMO_UNLOCK = new URLSearchParams(window.location.search).has('unlock');

// Every concept the three lessons teach, in order
const WORDS = ['Public address', 'Faucet', 'Signature', 'Network fee', 'Finality', 'Address poisoning'];

// Short label shown above each lesson title
const KICKERS = ['RECEIVE', 'SEND', 'SEND SAFELY'];

export default function App() {
  // Base58 address of the connected wallet, or null.
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null); // in SOL
  const [current, setCurrent] = useState(lessons[0].id);
  // Lessons the chain has verified, e.g. { 'lesson-1-connect': true }
  const [done, setDone] = useState({});
  // Words learned so far, and the ones learned most recently
  const [learned, setLearned] = useState([]);
  const [newest, setNewest] = useState([]);
  // Transactions sent in the lessons, newest first
  const [receipts, setReceipts] = useState([]);

  const Screen = SCREENS[current];
  const index = lessons.findIndex((l) => l.id === current);
  const lesson = lessons[index];
  const doneCount = lessons.filter((l) => done[l.id]).length;

  // Re-read the balance from devnet whenever something could have changed it
  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    getBalanceLamports(wallet)
      .then((l) => { if (!cancelled) setBalance(lamportsToSol(l)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [wallet, done, receipts]);

  function learn(words) {
    setLearned((prev) => [...new Set([...prev, ...words])]);
    setNewest(words);
  }

  function addReceipt(receipt) {
    setReceipts((prev) => [receipt, ...prev]);
  }

  return (
    <>
      <DevnetBanner />

      <header className="topbar">
        <h1>First Tx</h1>
        <p className="tagline">Learn crypto by doing it, on a practice blockchain.</p>
      </header>

      <main className="layout">
        <div className="main-col">
          <div className="panel">
            <nav className="path">
              {lessons.map((l, i) => {
                // Each lesson stays locked until the chain verified the one before it
                const locked = i > 0 && !done[lessons[i - 1].id] && !DEMO_UNLOCK;
                const isDone = !!done[l.id];
                const cls = ['node', l.id === current && 'current', isDone && 'done', locked && 'locked']
                  .filter(Boolean).join(' ');
                return (
                  <button key={l.id} className={cls} disabled={locked} onClick={() => setCurrent(l.id)}>
                    <span className="bubble">{isDone ? '✓' : i + 1}</span>
                    <span className="node-title">{l.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="panel lesson-panel">
            <div className="lesson-kicker">LESSON {index + 1} · {KICKERS[index]}</div>
            <Screen
              lesson={lesson}
              wallet={wallet}
              setWallet={setWallet}
              onComplete={() => setDone((d) => ({ ...d, [current]: true }))}
              onLearn={learn}
              onReceipt={addReceipt}
            />
          </div>
        </div>

        <Sidebar
          wallet={wallet}
          balance={balance}
          doneCount={doneCount}
          total={lessons.length}
          words={WORDS}
          learned={learned}
          newest={newest}
          receipts={receipts}
        />
      </main>
    </>
  );
}