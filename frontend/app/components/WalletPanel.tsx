"use client";

import React, { useEffect, useState } from "react";

// ❗ dùng relative import, KHÔNG dùng alias @/
import type { EvmIdentity } from "../../lib/wallet/types";
import { loadIdentity, saveIdentity, clearIdentity } from "../../lib/wallet/storage";
import { connectInjected, connectWalletConnect } from "../../lib/wallet/connectors";
import { attachWalletToBackend } from "../../lib/wallet/api";

function shortAddr(a: string) {
  return a.slice(0, 6) + "…" + a.slice(-4);
}

export default function WalletPanel() {
  const [identity, setIdentity] = useState<EvmIdentity | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("disconnected");

  const requiredChainId = Number(process.env.NEXT_PUBLIC_EVM_CHAIN_ID || "0") || 0;
  const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "";

  // load cached identity once
  useEffect(() => {
    const saved = loadIdentity();
    if (saved) setIdentity(saved);
  }, []);

  async function attach(id: EvmIdentity) {
    setStatus("attaching");
    const data = await attachWalletToBackend(id);
    setPlayerId(data.playerId);
    setStatus("connected");
  }

  async function onConnectInjected() {
    setStatus("connecting");
    try {
      const id = await connectInjected(requiredChainId || undefined);
      saveIdentity(id);
      setIdentity(id);
      await attach(id);
    } catch (e: any) {
      setStatus(e?.message ?? "connect failed");
    }
  }

  async function onConnectWC() {
    if (!wcProjectId) {
      setStatus("Missing NEXT_PUBLIC_WC_PROJECT_ID");
      return;
    }
    if (!requiredChainId) {
      setStatus("Missing NEXT_PUBLIC_EVM_CHAIN_ID");
      return;
    }

    setStatus("connecting");
    try {
      const { identity: id } = await connectWalletConnect(wcProjectId, requiredChainId);
      saveIdentity(id);
      setIdentity(id);
      await attach(id);
    } catch (e: any) {
      setStatus(e?.message ?? "connect failed");
    }
  }

  function onDisconnect() {
    clearIdentity();
    setIdentity(null);
    setPlayerId(null);
    setStatus("disconnected");
  }

  return (
    <div style={{ border: "1px solid #333", padding: 12, borderRadius: 8, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div><b>Wallet (EVM)</b></div>
          <div>Status: {status}</div>

          {identity && (
            <div>
              {shortAddr(identity.address)} • chainId={identity.chainId} • {identity.connector}
            </div>
          )}

          {playerId && (
            <div>
              playerId: <b>{playerId}</b>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {!identity ? (
            <>
              <button onClick={onConnectInjected}>Connect Injected</button>
              <button onClick={onConnectWC}>Connect WalletConnect</button>
            </>
          ) : (
            <button onClick={onDisconnect}>Disconnect</button>
          )}
        </div>
      </div>
    </div>
  );
}
