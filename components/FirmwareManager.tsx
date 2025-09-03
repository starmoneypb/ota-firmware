"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createOrUpdateFile,
  deleteFile,
  fileToBase64,
  GhSettings,
  listFirmwares,
  makeFirmwareUrl,
} from "@/lib/github";
import {
  fileNameToVersion,
  isValidSemverLike,
  toastError,
  versionToFileName,
} from "@/lib/utils";
import Spinner from "./Spinner";

type Row = {
  name: string;
  version: string | null;
  sha: string;
  downloadUrl: string | null;
};

const DEFAULTS: GhSettings = {
  owner: "starmoneypb",
  repo: "starmoneypb.github.io",
  branch: "gh-pages",
  baseUrl: "https://starmoneypb.github.io/ota-firmware",
  otaDir: "ota-firmware",
  token: "",
};

function usePersistedSettings() {
  const [s, setS] = useState<GhSettings>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    const saved = window.localStorage.getItem("gh_settings");
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("gh_settings", JSON.stringify(s));
  }, [s]);

  return [s, setS] as const;
}

export default function FirmwareManager({
  onPublish,
}: {
  onPublish: (payload: {
    firmware_url: string;
    version: string;
  }) => Promise<void>;
}) {
  const [settings, setSettings] = usePersistedSettings();
  const [list, setList] = useState<Row[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [version, setVersion] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);

  const canSave = useMemo(
    () =>
      !!settings.token &&
      isValidSemverLike(version) &&
      file?.name.endsWith(".bin") &&
      !saving,
    [settings.token, version, file, saving]
  );

  async function refresh() {
    try {
      setLoadingList(true);
      const items = await listFirmwares(settings);
      const rows: Row[] = items.map((x) => ({
        name: x.name,
        version: fileNameToVersion(x.name),
        sha: x.sha,
        downloadUrl: x.download_url,
      }));
      rows.sort((a, b) => (b.version ?? "").localeCompare(a.version ?? ""));
      setList(rows);
    } catch (e) {
      toastError(e);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    refresh(); /* eslint-disable-next-line */
  }, [settings.owner, settings.repo, settings.branch, settings.otaDir]);

  async function handleSave() {
    if (!canSave || !file) return;
    try {
      setSaving(true);
      const filename = versionToFileName(version);
      const path = `${settings.otaDir}/${filename}`;
      const base64 = await fileToBase64(file);
      const existing = list.find((x) => x.name === filename);
      await createOrUpdateFile(
        settings,
        path,
        base64,
        existing
          ? `chore(ota): update ${filename}`
          : `feat(ota): add ${filename}`,
        existing?.sha
      );
      await refresh();
      alert("Saved successfully.");
    } catch (e) {
      toastError(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: Row) {
    if (!confirm(`Delete ${row.name}?`)) return;
    try {
      await deleteFile(
        settings,
        `${settings.otaDir}/${row.name}`,
        row.sha,
        `chore(ota): delete ${row.name}`
      );
      await refresh();
    } catch (e) {
      toastError(e);
    }
  }

  async function handlePublish(row: Row) {
    if (!row.version) {
      alert("Invalid file name format, cannot derive version.");
      return;
    }
    const url = makeFirmwareUrl(settings, row.name);
    try {
      setPublishing(row.name);
      await onPublish({ firmware_url: url, version: row.version });
      alert("Published.");
    } catch (e) {
      toastError(e);
    } finally {
      setPublishing(null);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">GitHub Pages Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Owner</label>
            <input
              className="input"
              value={settings.owner}
              onChange={(e) =>
                setSettings({ ...settings, owner: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Repo</label>
            <input
              className="input"
              value={settings.repo}
              onChange={(e) =>
                setSettings({ ...settings, repo: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Branch</label>
            <input
              className="input"
              value={settings.branch}
              onChange={(e) =>
                setSettings({ ...settings, branch: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Base URL</label>
            <input
              className="input"
              value={settings.baseUrl}
              onChange={(e) =>
                setSettings({ ...settings, baseUrl: e.target.value })
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              ตัวอย่าง: https://starmoneypb.github.io
            </p>
          </div>
          <div>
            <label className="label">OTA Folder</label>
            <input
              className="input"
              value={settings.otaDir}
              onChange={(e) =>
                setSettings({ ...settings, otaDir: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">
              GitHub Fine-grained PAT (contents: read/write)
            </label>
            <input
              type="password"
              className="input"
              value={settings.token}
              onChange={(e) =>
                setSettings({ ...settings, token: e.target.value })
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              Token จะถูกเก็บใน localStorage ของเบราว์เซอร์คุณเท่านั้น
            </p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Add / Update Firmware</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="label">Firmware (.bin)</label>
            <input
              type="file"
              accept=".bin,application/octet-stream"
              className="input"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <label className="label">Version (e.g. 1.0.1)</label>
            <input
              className="input"
              placeholder="1.0.1"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>
          <div>
            <button
              className="btn btn-primary w-full"
              disabled={!canSave}
              onClick={handleSave}
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> Saving...
                </span>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          ไฟล์จะถูกอัปโหลดไปที่{" "}
          <code>
            {settings.repo}/{settings.otaDir}/firmware_&lt;version with
            underscores&gt;.bin
          </code>{" "}
          บนสาขา <code>{settings.branch}</code>.
        </p>
      </section>

      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Firmwares</h2>
          <button
            className="btn btn-outline"
            onClick={refresh}
            disabled={loadingList}
          >
            {loadingList ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Loading...
              </span>
            ) : (
              "Refresh"
            )}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr>
                <th className="py-2 pr-4">File</th>
                <th className="py-2 pr-4">Version</th>
                <th className="py-2 pr-4">URL</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => {
                const url = `${settings.baseUrl.replace(/\/$/, "")}/${
                  settings.otaDir
                }/${row.name}`;
                return (
                  <tr key={row.name} className="border-t">
                    <td className="py-2 pr-4 font-mono">{row.name}</td>
                    <td className="py-2 pr-4">{row.version ?? "-"}</td>
                    <td className="py-2 pr-4">
                      <a
                        className="text-brand-600 underline"
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {url}
                      </a>
                    </td>
                    <td className="py-2 pr-0 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-outline"
                          onClick={() => handlePublish(row)}
                          disabled={publishing !== null}
                        >
                          {publishing === row.name ? (
                            <span className="inline-flex items-center gap-2">
                              <Spinner /> Publishing...
                            </span>
                          ) : (
                            "Publish"
                          )}
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleDelete(row)}
                          disabled={publishing !== null}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && !loadingList && (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={4}>
                    No firmware files.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
