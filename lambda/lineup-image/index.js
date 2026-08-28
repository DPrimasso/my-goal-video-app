const { assetUrl, getAssetContext } = require('../shared/assets');
const { getMethod, handleError, parseJsonBody, responseOptions, responsePng } = require('../shared/http');
const { renderHtmlToPng } = require('../shared/render');
const { escapeHtml, validateLineup } = require('../shared/validation');

const createHandler = (renderer = renderHtmlToPng) => async (event, context) => {
  if (getMethod(event) === 'OPTIONS') return responseOptions();
  try {
    const { players, opponentTeam } = validateLineup(parseJsonBody(event));
    const assets = getAssetContext();
    const lineupUrl = (key) => assetUrl(assets, `lineup/${key}`);

    const playerRows = players.map(({ player, number, isCaptain }) => {
      const captainIcon = isCaptain ? `<img class="cap" src="${lineupUrl('cap.png')}" alt="Capitano" />` : '';
      return `<div class="row"><div class="num">${number}</div><div class="name">${escapeHtml(player.shortName.toUpperCase())} ${captainIcon}</div></div>`;
    }).join('');

    const sponsorNames = [
      'vega.png', 'loooma.png', 'mm.png', 'onlight.png', 'sens.png', 'neotec.png',
      'rubes-w.png', 'eurotir.png', 'transfilm.png', 'calzificio_leonardo.png',
      'delta_antinfortunistica.png', 'lavanderia_moderna.png',
    ];
    const sponsors = sponsorNames.map((name) => `<div class="sponsor"><img src="${lineupUrl(name)}" alt="" /></div>`).join('');

    const html = `<!doctype html>
<html lang="it"><head><meta charset="utf-8" /><style>
  @font-face{font-family:Tusker;src:url('${lineupUrl('TuskerGrotesk-3500Medium.woff2')}') format('woff2');font-weight:500;font-display:swap}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:2000px;background:#000;color:#fff;overflow:hidden;font-family:Tusker,sans-serif}
  .card{position:relative;width:1080px;height:2000px;padding:50px 40px 120px;display:flex;flex-direction:column;gap:10px;background:url('${lineupUrl('bg.jpg')}') center/cover no-repeat}
  .bgimg{position:absolute;inset:0;opacity:.2}.bgimg img{width:100%;height:100%;object-fit:cover}
  .element{position:relative;z-index:2;padding:70px;border-radius:10px;background:rgba(0,0,0,.8)}
  .element h1{font-size:180px;line-height:1;white-space:nowrap}.element p{margin-top:24px;font-size:60px;line-height:1;text-transform:uppercase}
  .flexmore{flex:1}.list{height:100%;display:flex;flex-direction:column;justify-content:space-between;gap:10px}
  .row{display:grid;grid-template-columns:1fr 9fr;font-size:80px;line-height:1}.num{color:#d00}.name{display:flex;align-items:center;gap:16px}.cap{width:54px;aspect-ratio:1}
  .logoimg{position:absolute;bottom:30px;left:120px;right:0;opacity:.1}.logoimg img{max-width:100%}
  .grid{position:relative;z-index:2;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .sponsor{aspect-ratio:2/1;border-radius:10px;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center}.sponsor img{width:60%;max-height:70%;object-fit:contain}
</style></head><body><div class="card">
  <div class="bgimg"><img src="${lineupUrl('group.png')}" alt="" /></div>
  <div class="element"><h1>STARTING XI</h1><p>VS ${escapeHtml(opponentTeam.toUpperCase())}</p></div>
  <div class="element flexmore"><div class="list">${playerRows}</div><div class="logoimg"><img src="${lineupUrl('logo.png')}" alt="" /></div></div>
  <div class="grid">${sponsors}</div>
</div></body></html>`;

    return responsePng(await renderer(html, { width: 1080, height: 2000 }));
  } catch (error) {
    return handleError(error, context?.awsRequestId);
  }
};

exports.createHandler = createHandler;
exports.handler = createHandler();
