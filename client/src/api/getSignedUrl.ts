export const getSignedUrl = async (key: string): Promise<string> => {
  const res = await fetch(`/api/signed-url?key=${encodeURIComponent(key)}`);
  if (!res.ok) {
    throw new Error('Unable to generate signed URL');
  }
  const data = await res.json();
  return data.url as string;
};
