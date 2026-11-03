import { useState } from 'react';

import DevnetBanner from './components/DevnetBanner.jsx';
import Lesson1Connect from './lessons/Lesson1Connect.jsx';
import Lesson2FirstSend from './lessons/Lesson2FirstSend.jsx';
import Lesson3ScamTrap from './lessons/Lesson3ScamTrap.jsx';
import { lessons } from './lib/lessons.js';

const SCREENS = {
  'lesson-1-connect': Lesson1Connect,
  'lesson-2-first-send': Lesson2FirstSend,
  'lesson-3-scam-trap': Lesson3ScamTrap,
};

// Add ?unlock to the URL to open every lesson (backup for live demos)
const DEMO_UNLOCK = new URLSearchParams(window.location.search).has('unlock');

// Every concept the three lessons teach, in order
const WORDS = ['Public address', 'Faucet', 'Signature', 'Network fee', 'Finality', 'Address poisoning'];

export default function App() {
  // Base58 address of the connected wallet, or null.
  const [wallet, setWallet] = useState(null);
  const [current, setCurrent] = useState(lessons[0].id);
  // Lessons the chain has verified, e.g. { 'lesson-1-connect': true }
  const [done, setDone] = useState({});
  // Words learned so far, and the ones learned most recently
  const [learned, setLearned] = useState([]);
  const [newest, setNewest] = useState([]);

  const Screen = SCREENS[current];
  const lesson = lessons.find((l) => l.id === current);
  const doneCount = lessons.filter((l) => done[l.id]).length;

  function learn(words) {
    setLearned((prev) => [...new Set([...prev, ...words])]);
    setNewest(words);
  }

  return (
    <>
      <DevnetBanner />
      <main>
        <h1>First Tx</h1>
        <p className="progress">{doneCount} of {lessons.length} lessons verified onchain</p>

        <div className="words">
          <span className="words-title">WORDS YOU KNOW</span>
          {WORDS.map((w) => {
            const cls = newest.includes(w) ? 'chip new' : learned.includes(w) ? 'chip on' : 'chip';
            return <span key={w} className={cls}>{w}</span>;
          })}
        </div>

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

        <Screen
          lesson={lesson}
          wallet={wallet}
          setWallet={setWallet}
          onComplete={() => setDone((d) => ({ ...d, [current]: true }))}
          onLearn={learn}
        />
      </main>
    </>
  );
}