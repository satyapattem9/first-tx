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

export default function App() {
  // Base58 address of the connected wallet, or null.
  const [wallet, setWallet] = useState(null);
  const [current, setCurrent] = useState(lessons[0].id);
  const Screen = SCREENS[current];
  const lesson = lessons.find((l) => l.id === current);

  return (
    <>
      <DevnetBanner />
      <main>
        <h1>First Tx</h1>
        <nav>
          {lessons.map((l, i) => (
            <button
              key={l.id}
              className={l.id === current ? 'active' : ''}
              // TODO(Person A): lock lessons 2–3 until a wallet is connected
              onClick={() => setCurrent(l.id)}
            >
              {i + 1}. {l.title}
            </button>
          ))}
        </nav>
        <Screen lesson={lesson} wallet={wallet} setWallet={setWallet} />
      </main>
    </>
  );
}
