import React, {useState} from 'react';
import './Formazione.css';
import '../VideoForm.css';
import {players} from '../players';

const Formazione: React.FC = () => {
  const [goalkeeper, setGoalkeeper] = useState(players[1]?.id || '');
  const [defenders, setDefenders] = useState([
    players[1]?.id || '',
    players[2]?.id || '',
    players[0]?.id || '',
    players[1]?.id || '',
  ]);
  const [midfielders, setMidfielders] = useState([
    players[2]?.id || '',
    players[0]?.id || '',
    players[1]?.id || '',
    players[2]?.id || '',
  ]);
  const [forwards, setForwards] = useState([
    players[0]?.id || '',
    players[1]?.id || '',
  ]);
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleArrayChange = (
      setter: React.Dispatch<React.SetStateAction<string[]>>,
      arr: string[],
      index: number
  ) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const copy = [...arr];
    copy[index] = e.target.value;
    setter(copy);
  };

  const generate = async () => {
    if (!goalkeeper) {
      alert('Seleziona il portiere');
      return;
    }
    setLoading(true);
    setGeneratedUrl(null);
    const payload = {goalkeeper, defenders, midfielders, forwards};
    try {
      const res = await fetch('/api/render-formation', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
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

  const renderSelect = (value: string, onChange: any) => (
      <select className="player-select" value={value} onChange={onChange}>
        <option value="">--</option>
        {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name.split(" ")[1]}
            </option>
        ))}
      </select>
  );

  return (
      <div className="formation-page">
        <h2>Formazione iniziale</h2>
        <div
            className="field"
            style={{backgroundImage: `url(${process.env.PUBLIC_URL}/campo_da_calcio.jpg)`}}
        >
          <div className="position" style={{top: '80%', left: '50%'}}>
            {renderSelect(goalkeeper, (e: any) => setGoalkeeper(e.target.value))}
          </div>
          {defenders.map((d, i) => (
              <div
                  key={`def-${i}`}
                  className="position"
                  style={{top: '65%', left: `${20 + i * 20}%`}}
              >
                {renderSelect(d, handleArrayChange(setDefenders, defenders, i))}
              </div>
          ))}
          {midfielders.map((m, i) => (
              <div
                  key={`mid-${i}`}
                  className="position"
                  style={{top: '45%', left: `${20 + i * 20}%`}}
              >
                {renderSelect(m, handleArrayChange(setMidfielders, midfielders, i))}
              </div>
          ))}
          {forwards.map((f, i) => (
              <div
                  key={`fwd-${i}`}
                  className="position"
                  style={{top: '25%', left: `${35 + i * 30}%`}}
              >
                {renderSelect(f, handleArrayChange(setForwards, forwards, i))}
              </div>
          ))}
        </div>
        <button className="form-button" onClick={generate} disabled={loading}>
          {loading ? 'Generazione...' : 'Genera Video'}
        </button>
        {generatedUrl && (
            <div className="preview-container">
              <video className="video-preview" src={generatedUrl} controls />
              <a className="download-link" href={generatedUrl} download>
                Scarica video
              </a>
            </div>
        )}
      </div>
  );
};

export default Formazione;