
'use client';

import FirmwareManager from '@/components/FirmwareManager';
import MqttStatus from '@/components/MqttStatus';
import { useMqtt } from '@/lib/mqtt';
import { useState } from 'react';

const TOPIC = 'device/ESP32-D15644';

export default function Page() {
  const { status, lastError, publish } = useMqtt({
    url: 'wss://test.mosquitto.org:8081',
    path: '/mqtt'
  });
  const [busyPublish, setBusyPublish] = useState(false);

  async function publishUpdate(payload: { firmware_url: string; version: string }) {
    if (status !== 'connected') throw new Error('MQTT not connected');
    setBusyPublish(true);
    const message = {
      command: 'UPDATE',
      payload
    };
    await publish(TOPIC, message, 0);
    setBusyPublish(false);
  }

  return (
    <main className="grid gap-6">
      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Connection</h2>
          <p className="text-xs text-gray-600">Host: test.mosquitto.org (wss:8081, path: /mqtt)</p>
        </div>
        <MqttStatus status={status} lastError={lastError}/>
      </section>

      <FirmwareManager onPublish={publishUpdate} />

      {busyPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="card">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              <div>
                <p className="font-medium">Publishing...</p>
                <p className="text-xs text-gray-500">กำลังส่งข้อความไปที่ <code>{TOPIC}</code></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
