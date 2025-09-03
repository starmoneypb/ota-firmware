export function isValidSemverLike(v: string) {
  return /^\d+\.\d+\.\d+$/.test(v.trim());
}

export function versionToFileName(version: string) {
  const safe = version.trim().replace(/\./g, "_");
  return `firmware_${safe}.bin`;
}

export function fileNameToVersion(name: string) {
  const m = name.match(/^firmware_(\d+)_(\d+)_(\d+)\.bin$/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : null;
}

export function toastError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  alert(`Error: ${msg}`);
}
