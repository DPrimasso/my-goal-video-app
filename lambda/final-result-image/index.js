const { assetUrl, getAssetContext, LINEUP_SPONSOR_KEYS } = require('../shared/assets');
const { getMethod, handleError, parseJsonBody, responseOptions, responsePng } = require('../shared/http');
const { renderHtmlToPng } = require('../shared/render');
const { escapeHtml, validateFinalResult } = require('../shared/validation');

const createHandler = (renderer = renderHtmlToPng) => async (event, context) => {
  if (getMethod(event) === 'OPTIONS') return responseOptions();

  try {
    const { homeTeam, awayTeam, homeScore, awayScore, scorerLines, scorersUnder } = validateFinalResult(parseJsonBody(event));
    const assets = getAssetContext();
    const lineupUrl = (key) => assetUrl(assets, `lineup/${key}`);
    const goalUrl = (key) => assetUrl(assets, `gol/gol/${key}`);

    const scorersItems = scorerLines
      .map((line) => `<div class="scorer">${escapeHtml(line)}</div>`)
      .join('');
    const scorersBlock = scorerLines.length > 0 ? `<div class="scorers-list">${scorersItems}</div>` : '';
    const homeScorersBlock = scorersUnder === 'home' ? scorersBlock : '';
    const awayScorersBlock = scorersUnder === 'away' ? scorersBlock : '';
    const homeResultClass = homeScore > awayScore ? 'winner' : '';
    const awayResultClass = awayScore > homeScore ? 'winner' : '';
    const sponsors = LINEUP_SPONSOR_KEYS
      .map((name) => `<div class="sponsor"><img src="${lineupUrl(name)}" alt="" /></div>`)
      .join('');

    const html = `<!doctype html>
<html lang="it"><head><meta charset="utf-8" /><style>
  @font-face{font-family:Tusker;src:url('${lineupUrl('TuskerGrotesk-3500Medium.woff2')}') format('woff2');font-weight:500;font-display:swap}
  @font-face{font-family:Founders;src:url('${goalUrl('FoundersGrotesk-Regular.woff2')}') format('woff2');font-weight:400;font-display:swap}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1440px;height:2560px;background:#000;color:#fff;overflow:hidden;font-family:Tusker,sans-serif}
  .card{position:relative;width:1440px;height:2560px;padding:80px 54px 150px;display:flex;flex-direction:column;gap:14px;background:url('${lineupUrl('bg.jpg')}') center/cover no-repeat;overflow:hidden}
  .bgimg{position:absolute;inset:0;opacity:.2}.bgimg img{width:100%;height:100%;object-fit:cover}
  .header{position:relative;z-index:2;padding:96px 90px 48px;border-radius:14px;background:rgba(0,0,0,.82);transform:translateY(32px)}
  .header h1{font-family:Founders,sans-serif;font-weight:400;font-size:160px;line-height:1;letter-spacing:2px;white-space:nowrap;text-align:center;display:flex;align-items:baseline;justify-content:center;gap:38px}
  .header .score-word{display:inline-block;color:#ed1010;text-shadow:0 8px 28px rgba(221,0,0,.28)}
  .score-stage{position:relative;z-index:2;flex:1;min-height:0;display:flex;align-items:center;justify-content:center}
  .logoimg{position:absolute;z-index:0;bottom:-80px;left:80px;right:0;opacity:.06;pointer-events:none}
  .logoimg img{width:210%;max-width:none;transform:rotate(-10deg);transform-origin:left center}
  .duel-wrap{position:relative;z-index:2;width:100%;padding:54px 34px 50px}
  .duel-wrap::before{content:'';position:absolute;inset:0;border:2px solid rgba(255,255,255,.12);border-radius:28px;background:linear-gradient(110deg,rgba(221,0,0,.13),rgba(0,0,0,.04) 42%,rgba(113,0,116,.11));box-shadow:inset 0 0 80px rgba(0,0,0,.16),0 30px 80px rgba(0,0,0,.12)}
  .duel{position:relative;width:100%;display:grid;grid-template-columns:minmax(0,1fr) 126px minmax(0,1fr);align-items:start}
  .team-column{position:relative;z-index:2;min-width:0;display:flex;flex-direction:column;align-items:stretch;gap:18px}
  .team-card{position:relative;min-width:0;height:450px;padding:58px 38px 44px;border:2px solid rgba(255,255,255,.12);border-radius:18px;background:linear-gradient(150deg,rgba(22,2,20,.94),rgba(0,0,0,.86));box-shadow:0 28px 70px rgba(0,0,0,.28);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:44px;text-transform:uppercase;overflow:hidden}
  .team-card::before{content:'';position:absolute;top:0;left:0;right:0;height:10px;background:rgba(255,255,255,.22)}
  .team-card::after{content:'';position:absolute;width:240px;height:240px;right:-160px;bottom:-160px;border:28px solid rgba(255,255,255,.025);transform:rotate(45deg)}
  .team-card.winner{border-color:rgba(221,0,0,.72);background:linear-gradient(150deg,rgba(78,0,20,.94),rgba(7,0,8,.9));box-shadow:0 0 0 1px rgba(221,0,0,.3),0 30px 80px rgba(185,0,34,.2)}
  .team-card.winner::before{background:#dd0000}
  .score{font-size:240px;line-height:.92;letter-spacing:-3px;text-shadow:0 10px 34px rgba(0,0,0,.3)}
  .team{max-width:100%;font-size:64px;line-height:1;letter-spacing:1px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .match-center{position:relative;z-index:4;height:450px;display:flex;align-items:center;justify-content:center}
  .match-center::before,.match-center::after{content:'';position:absolute;top:50%;width:74px;height:7px;background:#dd0000;box-shadow:0 0 18px rgba(221,0,0,.45)}
  .match-center::before{left:0}.match-center::after{right:0}
  .ft{position:relative;z-index:2;width:88px;height:88px;border:8px solid #260719;background:#dd0000;display:flex;align-items:center;justify-content:center;transform:rotate(45deg);box-shadow:0 14px 34px rgba(0,0,0,.38)}
  .ft span{font-size:38px;line-height:1;letter-spacing:2px;transform:rotate(-45deg)}
  .scorers-list{width:max-content;min-width:280px;max-width:88%;align-self:center;display:flex;flex-direction:column;align-items:stretch;gap:9px}
  .scorer{padding:15px 32px 13px;border-left:7px solid #dd0000;border-radius:8px;background:rgba(0,0,0,.84);font-size:48px;line-height:1;text-align:center;text-transform:uppercase;box-shadow:0 12px 30px rgba(0,0,0,.2)}
  .sponsors-grid{position:relative;z-index:2;display:grid;grid-template-columns:repeat(8,1fr);gap:10px;flex-shrink:0}
  .sponsor{grid-column:span 2;aspect-ratio:2.25/1;border-radius:10px;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center}
  .sponsor:nth-last-child(3):nth-child(4n+1){grid-column:2/span 2}
  .sponsor img{width:60%;max-height:70%;object-fit:contain}
</style></head><body><div class="card">
  <div class="bgimg"><img src="${lineupUrl('group.png')}" alt="" /></div>
  <header class="header"><h1><span>FINAL</span><span class="score-word">SCORE</span></h1></header>
  <main class="score-stage">
    <div class="logoimg"><img src="${lineupUrl('logo.png')}" alt="" /></div>
    <div class="duel-wrap">
      <div class="duel">
        <div class="team-column" data-side="home">
          <div class="team-card ${homeResultClass}"><span class="score">${escapeHtml(String(homeScore))}</span><span class="team">${escapeHtml(homeTeam.toUpperCase())}</span></div>
          ${homeScorersBlock}
        </div>
        <div class="match-center"><div class="ft"><span>FT</span></div></div>
        <div class="team-column" data-side="away">
          <div class="team-card ${awayResultClass}"><span class="score">${escapeHtml(String(awayScore))}</span><span class="team">${escapeHtml(awayTeam.toUpperCase())}</span></div>
          ${awayScorersBlock}
        </div>
      </div>
    </div>
  </main>
  <div class="sponsors-grid">${sponsors}</div>
</div></body></html>`;

    return responsePng(await renderer(html, { width: 1440, height: 2560 }));
  } catch (error) {
    return handleError(error, context?.awsRequestId);
  }
};

exports.createHandler = createHandler;
exports.handler = createHandler();
