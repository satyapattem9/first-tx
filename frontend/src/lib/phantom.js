// Thin wrapper around Phantom's injected provider (window.phantom.solana).

export function getPhantom() {
  const provider = window.phantom?.solana;
  return provider?.isPhantom ? provider : null;
}

export async function connectPhantom() {
  const phantom = getPhantom();
  if (!phantom) throw new Error("Phantom isn't installed in this browser.");
  const resp = await phantom.connect(); // opens the Phantom popup
  return resp.publicKey.toString();     // base58 address
}

export async function disconnectPhantom() {
  const phantom = getPhantom();
  if (phantom) await phantom.disconnect();
}

// Calls onChange(newAddress or null) when the user switches accounts in Phantom.
export function onAccountChanged(onChange) {
  const phantom = getPhantom();
  if (!phantom) return;
  phantom.on("accountChanged", (publicKey) => {
    onChange(publicKey ? publicKey.toString() : null);
  });
}