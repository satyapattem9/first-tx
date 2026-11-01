// Devnet connection and transaction helpers (@solana/web3.js).

// TODO(Person A, Sun): read the devnet balance for an address
export async function getBalanceLamports(address) {}

// TODO(Person A, Mon): build an unsigned SystemProgram transfer
export async function buildTransfer(from, to, lamports) {}

// TODO(Person A, Mon): estimated fee for the review panel
export async function estimateFeeLamports(tx) {}

// TODO(Person A, Mon): Phantom signs, we submit via our devnet connection; return signature
export async function signAndSend(tx) {}

// TODO(Person A, Mon): wait until the tx is confirmed; throw if it failed
export async function waitForConfirmation(signature) {}
