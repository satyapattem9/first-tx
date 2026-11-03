import httpx

from .config import SOLANA_RPC_URL


class RpcUnavailable(Exception):
    """RPC timed out or errored. Callers should report `pending`, never `fail`."""


async def get_transaction(signature: str, commitment: str) -> dict | None:
    """Fetch a transaction by signature via JSON-RPC `getTransaction`.

    Returns None if the RPC has not indexed it yet (treat as pending).
    """
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getTransaction",
        "params": [
            signature,
            # Devnet carries legacy, v0 and v1 transactions. Asking for less than the tx's version makes
            # the RPC return an error, which we'd report as "pending" forever.
            {"encoding": "jsonParsed", "commitment": commitment, "maxSupportedTransactionVersion": 1},
        ],
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(SOLANA_RPC_URL, json=payload)
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise RpcUnavailable(str(exc)) from exc

    body = resp.json()
    if "error" in body:
        raise RpcUnavailable(body["error"].get("message", "RPC error"))
    return body.get("result")
