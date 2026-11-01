import { Buffer } from 'buffer';

// @solana/web3.js expects Node's Buffer in the browser. Imported first in main.jsx.
globalThis.Buffer ??= Buffer;
