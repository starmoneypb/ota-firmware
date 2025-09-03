
'use client';

import Spinner from './Spinner';

export default function MqttStatus({ status, lastError }: { status: 'idle'|'connecting'|'connected'|'error', lastError?: string | null }) {
  const color =
    status === 'connected' ? 'bg-green-100 text-green-700' :
    status === 'connecting' ? 'bg-yellow-100 text-yellow-700' :
    status === 'error' ? 'bg-red-100 text-red-700' :
    'bg-gray-100 text-gray-700';

  return (
    <div className={`badge ${color} inline-flex items-center gap-2`}>
      {status === 'connecting' && <Spinner className="h-3 w-3" />}
      <span>MQTT: {status}</span>
      {status === 'error' && lastError && <span title={lastError}>⚠</span>}
    </div>
  );
}
