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

    const scorerCount = scorerLines.length;
    const stageLayoutClass = scorerCount <= 2
      ? ''
      : scorerCount === 3 ? 'stage-expanded-one' : 'stage-expanded-two';
    const scorersLayoutClass = scorerCount <= 2
      ? 'scorers-single scorers-few'
      : scorerCount <= 4 ? 'scorers-single'
      : scorerCount <= 8 ? 'scorers-grid-2'
        : scorerCount <= 12 ? 'scorers-grid-3 scorers-wide'
          : scorerCount <= 16 ? 'scorers-grid-4 scorers-wide'
            : scorerCount <= 24 ? 'scorers-grid-4 scorers-wide scorers-tight'
              : scorerCount <= 32 ? 'scorers-grid-5 scorers-wide scorers-compact'
                : 'scorers-grid-5 scorers-wide scorers-ultra-compact';
    const scorerTextClass = (line) => {
      if (line.length > 24) return 'scorer scorer-long';
      if (line.length > 18) return 'scorer scorer-medium';
      return 'scorer';
    };
    const scorersItems = scorerLines
      .map((line) => `<div class="${scorerTextClass(line)}">${escapeHtml(line)}</div>`)
      .join('');
    const scorersBlock = scorerCount > 0
      ? `<div class="scorers-list ${scorersLayoutClass}">${scorersItems}</div>`
      : '';
    const homeScorersBlock = scorersUnder === 'home' ? scorersBlock : '';
    const awayScorersBlock = scorersUnder === 'away' ? scorersBlock : '';
    const homeResultClass = homeScore > awayScore ? 'winner' : '';
    const awayResultClass = awayScore > homeScore ? 'winner' : '';
    const teamTextClass = (teamName) => {
      const length = teamName.trim().length;
      if (length > 18) return 'team team-small';
      if (length > 12) return 'team team-medium';
      return 'team';
    };
    const sponsors = LINEUP_SPONSOR_KEYS
      .map((name) => `<div class="sponsor"><img src="${lineupUrl(name)}" alt="" /></div>`)
      .join('');

    const html = `<!doctype html>
<html lang="it"><head><meta charset="utf-8" /><style>
  @font-face{font-family:Tusker;src:url('${lineupUrl('TuskerGrotesk-3500Medium.woff2')}') format('woff2');font-weight:500;font-display:swap}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1440px;height:2560px;background:#000;color:#fff;overflow:hidden;font-family:Tusker,sans-serif}
  .card{position:relative;width:1440px;height:2560px;padding:54px 54px 130px;display:flex;flex-direction:column;gap:14px;background:url('${lineupUrl('bg.jpg')}') center/cover no-repeat;overflow:hidden}
  .bgimg{position:absolute;inset:0;opacity:.17}.bgimg img{width:100%;height:100%;object-fit:cover}
  .header{position:relative;z-index:3;height:612px;flex:none;display:flex;align-items:flex-end;justify-content:center;padding:0 42px 132px;background:radial-gradient(ellipse at center,rgba(3,0,10,.74) 0%,rgba(3,0,10,.46) 48%,rgba(3,0,10,0) 78%)}
  .header h1{position:relative;z-index:2;font-family:Tusker,sans-serif;font-weight:500;font-size:285px;line-height:.92;letter-spacing:1px;white-space:nowrap;text-align:center;display:flex;align-items:baseline;justify-content:center;gap:36px;text-shadow:0 16px 40px rgba(0,0,0,.5)}
  .header .score-word{display:inline-block;color:#ed1010;text-shadow:0 10px 34px rgba(221,0,0,.32)}
  .header-line{position:absolute;left:78px;right:78px;bottom:72px;height:5px;background:linear-gradient(90deg,#ed1010 0%,#ed1010 38%,#cc006f 68%,#cf00ff 100%);box-shadow:0 0 18px rgba(224,0,95,.35)}
  .header-line::before,.header-line::after{content:'';position:absolute;top:-18px;width:92px;height:40px;background:repeating-linear-gradient(135deg,transparent 0 12px,#ed1010 13px 17px,transparent 18px 27px)}
  .header-line::before,.header-line::after{-webkit-mask-image:linear-gradient(90deg,#000 0%,rgba(0,0,0,.9) 42%,transparent 100%);mask-image:linear-gradient(90deg,#000 0%,rgba(0,0,0,.9) 42%,transparent 100%)}
  .header-line::before{left:-10px}.header-line::after{right:-10px;transform:scaleX(-1);filter:hue-rotate(295deg)}
  .score-stage{position:relative;z-index:2;height:910px;flex:none;padding:6px;border-radius:68px 68px 44px 44px;background:linear-gradient(105deg,#ed1010 0%,#ed1010 34%,#b80061 68%,#d000ff 100%);box-shadow:0 34px 74px rgba(0,0,0,.42),0 0 42px rgba(196,0,102,.16)}
  .score-stage.stage-expanded-one{height:998px}
  .score-stage.stage-expanded-two{height:1086px}
  .score-stage-surface{position:relative;width:100%;height:100%;padding:38px 44px 32px;border-radius:62px 62px 39px 39px;background:linear-gradient(112deg,rgba(40,0,10,.965) 0%,rgba(10,0,11,.97) 45%,rgba(5,0,10,.96) 100%);overflow:hidden}
  .score-stage-surface::before,.score-stage-surface::after{content:'';position:absolute;z-index:1;width:230px;height:380px;opacity:.94;background:repeating-linear-gradient(135deg,transparent 0 22px,rgba(237,16,16,.98) 23px 29px,rgba(188,0,74,.7) 30px 33px,transparent 34px 50px);-webkit-mask-image:radial-gradient(ellipse at top left,#000 0%,#000 25%,rgba(0,0,0,.9) 42%,rgba(0,0,0,.46) 62%,transparent 84%);mask-image:radial-gradient(ellipse at top left,#000 0%,#000 25%,rgba(0,0,0,.9) 42%,rgba(0,0,0,.46) 62%,transparent 84%)}
  .score-stage-surface::before{left:-40px;top:42px}.score-stage-surface::after{right:-38px;bottom:-28px;transform:rotate(180deg)}
  .logoimg{position:absolute;z-index:0;bottom:-190px;left:180px;right:0;opacity:.055;pointer-events:none}
  .logoimg img{width:165%;max-width:none;transform:rotate(-10deg);transform-origin:left center}
  .duel-wrap{position:relative;z-index:2;width:100%;height:100%;transform:translateY(-20px)}
  .duel{position:relative;width:100%;height:100%;display:grid;grid-template-columns:minmax(0,1fr) 154px minmax(0,1fr);align-items:start}
  .duel::after{content:'';position:absolute;z-index:1;left:0;right:0;top:620px;height:3px;background:linear-gradient(90deg,rgba(237,16,16,.72),rgba(237,16,16,.28) 42%,rgba(207,0,255,.3) 68%,rgba(207,0,255,.68))}
  .team-column{position:relative;z-index:2;min-width:0;height:100%;display:flex;flex-direction:column;align-items:stretch;gap:12px}
  .team-card{position:relative;min-width:0;height:620px;flex:none;text-transform:uppercase;overflow:visible}
  .team-card.winner::before{content:'';position:absolute;z-index:-1;inset:-38px -30px 0;background:radial-gradient(ellipse at 18% 38%,rgba(142,0,22,.3),rgba(142,0,22,0) 70%)}
  .score{position:absolute;top:206px;left:20px;right:20px;height:370px;font-size:340px;line-height:1.05;letter-spacing:-3px;display:flex;align-items:center;justify-content:center;text-align:center;text-shadow:0 14px 34px rgba(0,0,0,.38)}
  .team{position:absolute;left:12px;right:12px;top:44px;height:146px;font-size:88px;line-height:1.1;letter-spacing:1px;display:flex;align-items:center;justify-content:center;text-align:center;white-space:normal;overflow:visible}
  .team-medium{font-size:76px}
  .team-small{font-size:65px}
  .match-center{position:relative;z-index:4;height:100%;display:flex;align-items:flex-start;justify-content:center;padding-top:276px}
  .match-center::before{content:'';position:absolute;z-index:-1;top:0;bottom:0;left:50%;width:3px;transform:translateX(-50%);background:linear-gradient(to bottom,rgba(237,16,16,.78),rgba(237,16,16,.32) 48%,rgba(207,0,255,.5));box-shadow:0 0 16px rgba(221,0,0,.25)}
  .ft{position:relative;z-index:2;width:132px;height:132px;border:8px solid #260719;background:linear-gradient(135deg,#a40020,#ed1010 58%,#d90074);display:flex;align-items:center;justify-content:center;transform:rotate(45deg);box-shadow:0 16px 38px rgba(0,0,0,.45),0 0 0 3px rgba(207,0,255,.55)}
  .ft span{position:absolute;inset:-12px;display:flex;align-items:center;justify-content:center;font-size:56px;line-height:1.2;letter-spacing:2px;transform:rotate(-45deg)}
  .scorers-list{--scorer-size:66px;--scorer-row:80px;width:max-content;min-width:330px;max-width:92%;display:flex;flex-direction:column;align-items:stretch;gap:8px;padding-top:12px}
  .team-column:first-child .scorers-list{align-self:flex-start;margin-left:54px}
  .team-column:last-child .scorers-list{align-self:flex-end;margin-right:54px}
  .scorer{min-width:0;min-height:var(--scorer-row);padding:7px 18px 9px;border-left:6px solid #ed1010;font-size:var(--scorer-size);line-height:1.05;display:flex;align-items:center;justify-content:flex-start;text-align:left;text-transform:uppercase;white-space:nowrap;text-shadow:0 8px 22px rgba(0,0,0,.4)}
  .scorer-medium{font-size:calc(var(--scorer-size) * .84)}
  .scorer-long{font-size:calc(var(--scorer-size) * .68)}
  .scorers-single{position:absolute;top:620px;height:calc(100% - 620px);justify-content:center;padding-top:0}
  .scorers-few{--scorer-size:58px;--scorer-row:72px}
  .team-column:first-child .scorers-single{left:54px;margin-left:0}
  .team-column:last-child .scorers-single{right:54px;margin-right:0}
  .scorers-grid-2{--scorer-size:52px;--scorer-row:64px;position:absolute;top:620px;height:calc(100% - 620px);width:calc(100% - 24px);min-width:0;max-width:none;display:grid;align-content:center;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 10px;padding-top:0}
  .team-column:first-child .scorers-grid-2{left:12px;margin-left:0}
  .team-column:last-child .scorers-grid-2{right:12px;margin-right:0}
  .scorers-wide{position:absolute;top:620px;height:calc(100% - 620px);width:1124px;min-width:0;max-width:none;display:grid;align-content:center;gap:7px 12px;padding-top:0}
  .team-column:first-child .scorers-wide{left:54px;margin-left:0}
  .team-column:last-child .scorers-wide{right:54px;margin-right:0}
  .scorers-grid-3{--scorer-size:52px;--scorer-row:64px;grid-template-columns:repeat(3,minmax(0,1fr))}
  .scorers-grid-4{--scorer-size:46px;--scorer-row:57px;grid-template-columns:repeat(4,minmax(0,1fr))}
  .scorers-grid-5{--scorer-size:34px;--scorer-row:43px;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px 9px}
  .scorers-tight{--scorer-size:39px;--scorer-row:49px;gap:5px 10px}
  .scorers-compact{--scorer-size:33px;--scorer-row:42px}
  .scorers-ultra-compact{--scorer-size:28px;--scorer-row:37px;gap:4px 8px}
  .scorers-wide .scorer{padding-left:14px;padding-right:10px;border-left-width:5px}
  .sponsors-grid{position:relative;z-index:2;display:grid;grid-template-columns:repeat(8,1fr);gap:10px;flex-shrink:0;margin-top:auto}
  .sponsor{grid-column:span 2;aspect-ratio:2.25/1;border-radius:10px;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center}
  .sponsor:nth-last-child(3):nth-child(4n+1){grid-column:2/span 2}
  .sponsor img{width:60%;max-height:70%;object-fit:contain}
</style></head><body><div class="card">
  <div class="bgimg"><img src="${lineupUrl('group.png')}" alt="" /></div>
  <header class="header"><h1><span>FINAL</span><span class="score-word">SCORE</span></h1><div class="header-line" aria-hidden="true"></div></header>
  <main class="score-stage ${stageLayoutClass}">
    <div class="score-stage-surface">
      <div class="logoimg"><img src="${lineupUrl('logo.png')}" alt="" /></div>
      <div class="duel-wrap">
        <div class="duel">
          <div class="team-column" data-side="home">
            <div class="team-card ${homeResultClass}"><span class="score">${escapeHtml(String(homeScore))}</span><span class="${teamTextClass(homeTeam)}">${escapeHtml(homeTeam.toUpperCase())}</span></div>
            ${homeScorersBlock}
          </div>
          <div class="match-center"><div class="ft"><span>FT</span></div></div>
          <div class="team-column" data-side="away">
            <div class="team-card ${awayResultClass}"><span class="score">${escapeHtml(String(awayScore))}</span><span class="${teamTextClass(awayTeam)}">${escapeHtml(awayTeam.toUpperCase())}</span></div>
            ${awayScorersBlock}
          </div>
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
