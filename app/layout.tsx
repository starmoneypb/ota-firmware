
import './globals.css';

export const metadata = {
  title: 'MQTT OTA Manager',
  description: 'Manage OTA firmware on GitHub Pages & publish over MQTT'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <div className="mx-auto max-w-5xl px-4 py-6">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold">MQTT OTA Manager</h1>
            <p className="text-sm text-gray-600 mt-1">
              OTA via GitHub Pages + MQTT over WebSocket
            </p>
          </header>
          {children}
          <footer className="mt-10 text-xs text-gray-500">
            <p>
              WebSocket MQTT: wss://test.mosquitto.org:8081 (path <code>/mqtt</code>).
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
