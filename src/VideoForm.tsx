import React, {useState} from 'react';

const VideoForm: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!videoFile) {
      alert('Seleziona un file MP4');
      return;
    }
    setLoading(true);
    setGeneratedUrl(null);
    const data = new FormData();
    data.append('playerName', playerName);
    data.append('clip', videoFile);

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        body: data,
      });
      const json = await res.json();
      if (res.ok) {
        setGeneratedUrl(json.video);
      } else {
        alert(json.error || 'Errore nella generazione');
      }
    } catch (err) {
      alert('Errore nella richiesta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <label>
          Nome Giocatore:
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Upload MP4:
          <input
            type="file"
            accept="video/mp4"
            onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
          />
        </label>
      </div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generazione in corso...' : 'Genera Video'}
      </button>
      {generatedUrl && (
        <div>
          Video generato: <a href={generatedUrl}>{generatedUrl}</a>
        </div>
      )}
    </div>
  );
};

export default VideoForm;
