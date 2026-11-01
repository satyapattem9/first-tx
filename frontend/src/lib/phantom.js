// Thin wrapper around Phantom's injected provider (window.phantom.solana).

// TODO(Person A, Sun): return window.phantom.solana if installed, else null
export function getPhantom() {}

// TODO(Person A, Sun): prompt to connect, return the base58 address
export async function connectPhantom() {}

// TODO(Person A): disconnect + handle 'accountChanged'
export async function disconnectPhantom() {}
