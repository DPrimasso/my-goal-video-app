import React, {useState} from 'react';
import './Formazione.css';
import '../VideoForm.css';
import {players} from '../players';

const Formazione: React.FC = () => {
  const [goalkeeper, setGoalkeeper] = useState(players[1]?.id || '');
  const [defenders, setDefenders] = useState<string[]>([
    players[1]?.id || '',
    players[2]?.id || '',
    players[0]?.id || '',
    players[1]?.id || '',
    '',
  ]);
  const [midfielders, setMidfielders] = useState<string[]>([
    '',
    players[2]?.id || '',
    players[0]?.id || '',
    players[1]?.id || '',
    '',
  ]);
  const [attackingMidfielders, setAttackingMidfielders] = useState<string[]>([
    '',
    players[1]?.id || '',
    '',
  ]);
  const [forwards, setForwards] = useState<string[]>([
    players[0]?.id || '',
    '',
    players[2]?.id || '',
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
    const totalPlayers = [
      goalkeeper,
      ...defenders,
      ...midfielders,
      ...attackingMidfielders,
      ...forwards,
    ].filter(Boolean).length;
    if (totalPlayers !== 11) {
      alert('Seleziona 11 giocatori');
      return;
    }
    setLoading(true);
    setGeneratedUrl(null);
    const payload = {goalkeeper, defenders, midfielders, attackingMidfielders, forwards};
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
                  style={{top: '65%', left: ['10%','30%','50%','70%','90%'][i]}}
              >
                {renderSelect(d, handleArrayChange(setDefenders, defenders, i))}
              </div>
          ))}
          {midfielders.map((m, i) => (
              <div
                  key={`mid-${i}`}
                  className="position"
                  style={{top: '50%', left: ['10%','30%','50%','70%','90%'][i]}}
              >
                {renderSelect(m, handleArrayChange(setMidfielders, midfielders, i))}
              </div>
          ))}
          {attackingMidfielders.map((t, i) => (
              <div
                  key={`treq-${i}`}
                  className="position"
                  style={{top: '35%', left: ['30%','50%','70%'][i]}}
              >
                {renderSelect(t, handleArrayChange(setAttackingMidfielders, attackingMidfielders, i))}
              </div>
          ))}
          {forwards.map((f, i) => (
              <div
                  key={`fwd-${i}`}
                  className="position"
                  style={{top: '20%', left: ['30%','50%','70%'][i]}}
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