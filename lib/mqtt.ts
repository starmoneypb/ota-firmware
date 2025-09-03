"use client";

import { useEffect, useRef, useState } from "react";
import mqtt, { MqttClient } from "mqtt";

export function useMqtt(opts?: {
  url?: string;
  path?: string;
  clientId?: string;
  keepalive?: number;
}) {
  const url = opts?.url ?? "wss://test.mosquitto.org:8081";
  const path = opts?.path ?? "/mqtt";
  const clientRef = useRef<MqttClient | null>(null);

  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setStatus("connecting");

    // generate unique clientId
    const clientId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `web-${crypto.randomUUID()}`
        : `web-${Math.random().toString(16).slice(2)}-${Date.now()}`;

    const client: MqttClient = mqtt.connect(url, {
      protocol: "wss",
      path,
      clientId: opts?.clientId ?? clientId,
      clean: true,
      keepalive: opts?.keepalive ?? 60,
      reconnectPeriod: 2000, // auto reconnect
      connectTimeout: 30_000,
      protocolVersion: 4, // MQTT 3.1.1
    });

    clientRef.current = client;

    client.on("connect", () => mounted && setStatus("connected"));
    client.on("reconnect", () => mounted && setStatus("connecting"));
    client.on("error", (err: any) => {
      if (!mounted) return;
      setLastError(String(err?.message || err));
      setStatus("error");
    });
    client.on("close", () => mounted && setStatus("error"));

    return () => {
      mounted = false;
      try {
        client.end(true);
      } catch {}
    };
  }, [url, path]);

  async function publish(topic: string, payload: unknown, qos: 0 | 1 | 2 = 0) {
    const client = clientRef.current;
    if (!client || status !== "connected") {
      throw new Error("MQTT not connected");
    }
    return new Promise<void>((resolve, reject) => {
      const msg =
        typeof payload === "string" ? payload : JSON.stringify(payload);
      client.publish(topic, msg, { qos }, (err?: Error) =>
        err ? reject(err) : resolve()
      );
    });
  }

  return { status, lastError, publish };
}
