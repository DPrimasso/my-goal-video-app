// Attempts to trigger a browser download by appending a
// `response-content-disposition` query string. This works with S3 and
// other storage providers that respect the parameter, without requiring
// a CORS-enabled fetch of the file contents.
export async function forceDownload(url: string, filename: string) {
  const encoded = encodeURIComponent(`attachment; filename="${filename}"`);
  const separator = url.includes('?') ? '&' : '?';
  const dlUrl = `${url}${separator}response-content-disposition=${encoded}`;
  const a = document.createElement('a');
  a.href = dlUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
