// Downloads a file by fetching it and constructing a temporary blob URL.
// This avoids needing special response headers from the storage provider.
export async function forceDownload(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Download failed');
  }
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}
