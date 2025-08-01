import React, {useState} from 'react';

const VideoForm: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [videoPath, setVideoPath] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const handleGenerate = () => {
    console.log('Player Name:', playerName);
    console.log('Video Path:', videoPath);
    console.log('Video File:', videoFile);
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
          Percorso MP4:
          <input
            type="text"
            value={videoPath}
            onChange={(e) => setVideoPath(e.target.value)}
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
      <button onClick={handleGenerate}>Genera Video</button>
    </div>
  );
};

export default VideoForm;
