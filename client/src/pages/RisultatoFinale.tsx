import React, {useEffect, useState} from 'react';
import '../VideoForm.css';
import {players} from '../players';
import {teams} from '../teams';

const CASALPOGLIO_ID = teams[0].id;

const RisultatoFinale: React.FC = () => {
  const [teamA, setTeamA] = useState(teams[0].id);
  const [teamB, setTeamB] = useState('');
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [scorers, setScorers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleTeamAChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTeamA(val);
    if (val !== CASALPOGLIO_ID) {
      setTeamB(CASALPOGLIO_ID);
    }
  };

  const handleTeamBChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTeamB(val);
    if (val !== CASALPOGLIO_ID) {
      setTeamA(CASALPOGLIO_ID);
    }
  };

  const getSurname = (name: string) => name.split(' ').slice(-1)[0];

  const casalpoglioGoals =
    teamA === CASALPOGLIO_ID ? Number(scoreA) : Number(scoreB);

  useEffect(() => {
    setScorers((prev) => {
      const goals = isNaN(casalpoglioGoals) ? 0 : casalpoglioGoals;
      if (goals > prev.length) {
        return [...prev, ...Array(goals - prev.length).fill('')];
      }
      return prev.slice(0, goals);
    });
  }, [casalpoglioGoals]);

  const handleScorerChange = (index: number, value: string) => {
    setScorers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const generate = async () => {
    if (!teamA || !teamB) {
      alert('Seleziona entrambe le squadre');
      return;
    }
    if (scoreA === '' || scoreB === '') {
      alert('Inserisci il risultato');
      return;
    }
    setLoading(true);
    setGeneratedUrl(null);
    const payload = {
      teamA,
      teamB,
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      scorers: scorers.filter(Boolean),
    };
    try {
      const res = await fetch('/api/render-result', {
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

  return (
    <div className="video-form">
      <div className="form-section">
        <label className="form-label">
          Squadra 1:
          <select className="form-input" value={teamA} onChange={handleTeamAChange}>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Squadra 2:
          <select className="form-input" value={teamB} onChange={handleTeamBChange}>
            <option value="">Seleziona...</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Risultato:
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <input
              className="form-input"
              type="number"
              min="0"
              value={scoreA}
              onChange={(e) => setScoreA(e.target.value)}
              placeholder="Squadra 1"
              style={{width: '50%'}}
            />
            <input
              className="form-input"
              type="number"
              min="0"
              value={scoreB}
              onChange={(e) => setScoreB(e.target.value)}
              placeholder="Squadra 2"
              style={{width: '50%'}}
            />
          </div>
        </label>
        {(teamA === CASALPOGLIO_ID || teamB === CASALPOGLIO_ID) && (
          <div className="form-label">
            Marcatori Casalpoglio:
            {scorers.map((scorer, i) => (
              <label
                key={i}
                style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}
              >
                {`Gol ${i + 1}:`}
                <select
                  className="form-input"
                  value={scorer}
                  onChange={(e) => handleScorerChange(i, e.target.value)}
                >
                  <option value="">Seleziona...</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {getSurname(p.name)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}
        <button className="form-button" onClick={generate} disabled={loading}>
          {loading ? 'Generazione...' : 'Genera Video'}
        </button>
      </div>
      <div className="preview-container">
        {generatedUrl ? (
          <>
            <video className="video-preview" src={generatedUrl} controls />
            <a className="download-link" href={generatedUrl} download>
              Scarica video
            </a>
          </>
        ) : (
          <div className="preview-placeholder">Anteprima video</div>
        )}
      </div>
    </div>
  );
};

export default RisultatoFinale;
