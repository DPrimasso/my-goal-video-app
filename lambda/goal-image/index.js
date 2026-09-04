const { assetUrl, getAssetContext } = require('../shared/assets');
const { catalog } = require('../shared/catalog');
const { getMethod, handleError, parseJsonBody, responseOptions, responsePng } = require('../shared/http');
const { renderHtmlToPng } = require('../shared/render');
const { escapeHtml, validateGoal } = require('../shared/validation');

function renderMilestone(goalCount) {
  if (goalCount === 1) return '';

  const crown = goalCount === 3 ? `
        <svg class="milestone-crown" viewBox="0 0 180 120" aria-hidden="true">
          <path d="M20 90 L34 27 L73 67 L104 18 L126 69 L163 44 L151 97 Z" />
          <path d="M24 103 C65 109 111 110 153 103" />
        </svg>` : '';
  const label = goalCount === 2 ? 'DOPPIETTA' : 'HATTRICK';

  return `
      <div class="milestone milestone-${goalCount}" aria-hidden="true">
        <div class="milestone-copy">
          ${crown}
          <div class="milestone-label">${label}</div>
          <span class="milestone-underline"></span>
        </div>
      </div>`;
}

function renderGoalBalls(goalCount) {
  if (goalCount === 1) return '';
  const ball = `<svg class="goal-ball" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="28" />
          <path d="M32 19 L42 26 L38 38 L26 38 L22 26 Z M32 19 L32 8 M42 26 L54 22 M38 38 L46 51 M26 38 L18 51 M22 26 L10 22 M17 10 L32 8 L47 10 M54 22 L58 38 L46 51 M18 51 L6 38 L10 22" />
        </svg>`;
  return `<span class="goal-balls">${Array.from({ length: goalCount }, () => ball).join('')}</span>`;
}

const createHandler = (renderer = renderHtmlToPng) => async (event, context) => {
  if (getMethod(event) === 'OPTIONS') return responseOptions();

  try {
    const { player, goalCount, minuteGoal, homeTeam, homeScore, awayTeam, awayScore } = validateGoal(parseJsonBody(event));
    const assets = getAssetContext();
    const golBaseUrl = assetUrl(assets, 'gol/gol');
    const absolutePlayerImageUrl = assetUrl(assets, player.assetKey || catalog.fallbackPlayerAssetKey);
    const playerName = player.shortName;
    const milestoneMarkup = renderMilestone(goalCount);
    const goalBallsMarkup = renderGoalBalls(goalCount);

    const htmlTemplate = `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Goal — 9:16</title>
  <style>
    :root{
      --bg1:#1b0b3a;
      --bg2:#7a0014;
      --panel:#0f0b2a;
      --accent:#e12121;
      --white: #ffffff;
      --muted: rgb(255,255,255);
    }
    @font-face {
      font-family: 'Tusker';
      src: url('${golBaseUrl}/TuskerGrotesk-3500Medium.woff2') format('woff2'),
           url('${golBaseUrl}/TuskerGrotesk-3500Medium.woff') format('woff');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
      ascent-override: 110%;
    }
    @font-face {
      font-family: 'Founders';
      src: url('${golBaseUrl}/FoundersGrotesk-Regular.woff2') format('woff2'),
           url('${golBaseUrl}/FoundersGrotesk-Regular.woff') format('woff');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
      ascent-override: 110%;
    }
    html,body{
      color:white;
      font-weight:500;
      font-family: 'Tusker';
      width: 100vw;
      margin:0;
      background-color: black;
      display: flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
    }
    .card{
      width: 1440px;
      height:2560px;
      overflow:hidden;
      padding:80px 40px;
      background-image: linear-gradient(to bottom, #00002d, #3b0649, #7e004f, #b8003a, #dd0000);
      position:relative;
      display:flex;
      justify-content:space-between;
      gap:10px;
      flex-direction:column;
    }
    .main-text{
      width:100%;
      display: flex;
      justify-content: center;
      align-items: center;
      position:relative;
      z-index:20;
    }
    .main-text svg{
      width:90%;
    }
    .main-text svg path{
      fill:url(#goal-title-gradient);
    }
    .logoback{
      position:absolute;
      z-index:10;
      top: 50%;
      width:200%;
      transform: rotate(-45deg) translateY(-75%);
      transform-origin:center;
    }
    .logoback img{
      width:100%;
      opacity:.1;
    }
    .player{
      position:absolute;
      z-index:25;
      bottom:335px;
      left:0;
      width:100%;
      height:75%;
      display:flex;
      justify-content:center;
      align-items:flex-end;
      pointer-events:none;
    }
    .player img{
      height:100%;
      width:auto;
      transform:scale(1);
      transform-origin:center bottom;
      object-fit:contain;
      object-position:center bottom;
      display:block;
    }
    .milestone{
      position:absolute;
      inset:0;
      z-index:auto;
      pointer-events:none;
    }
    .milestone-copy{
      position:absolute;
      z-index:35;
      right:38px;
      top:875px;
      width:500px;
      color:#fff;
      text-align:center;
      transform:rotate(-7deg);
      filter:drop-shadow(0 5px 2px rgba(34,0,42,.72));
    }
    .milestone-3 .milestone-copy{
      right:24px;
      top:720px;
      width:550px;
    }
    .milestone-label{
      font-family:'Tusker', sans-serif;
      font-size:118px;
      font-style:italic;
      line-height:.82;
      letter-spacing:3px;
      white-space:nowrap;
      text-transform:uppercase;
      -webkit-text-stroke:2px rgba(255,255,255,.55);
    }
    .milestone-3 .milestone-label{
      font-size:106px;
    }
    .milestone-underline{
      display:block;
      width:95%;
      height:26px;
      margin:20px auto 0;
      background:#ed1420;
      clip-path:polygon(0 43%, 100% 0, 86% 58%, 100% 52%, 12% 100%);
      transform:rotate(-4deg);
    }
    .milestone-crown{
      width:195px;
      height:125px;
      margin:0 auto 12px;
      overflow:visible;
    }
    .milestone-crown path{
      fill:none;
      stroke:#fff;
      stroke-width:9px;
      stroke-linecap:square;
      stroke-linejoin:miter;
    }
    .card .grid{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      position: absolute;
      bottom: 220px;
      left: 100px;
      right: 100px;
      z-index:50;
    }
    .card .grid .result{
      grid-column: span 2 / span 2;
      font-family: 'Founders';
      font-weight:400;
      border-radius: 10px;
      background-color: rgba(0, 0, 0, .8);
      display: flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      font-size:160px;
      text-transform:uppercase;
      padding:40px 24px;
      line-height:1;
      gap:12px;
      letter-spacing:-2px;
      -webkit-font-smoothing:antialiased;
      -moz-osx-font-smoothing:grayscale;
    }
    .card .grid .result .squ{
      font-family: 'Founders';
      font-weight:400;
      font-size:54px;
      text-transform:uppercase;
      letter-spacing:-1px;
    }
    .card .grid .gol{
      padding:24px 24px;
      grid-column: span 4 / span 4;
      border-radius: 10px;
      background-color: rgba(0, 0, 0, .8);
      display: flex;
      font-family: 'Founders';
      font-weight:600;
      flex-direction:row;
      align-items:center;
      justify-content:center;
      gap:22px;
      font-size:82px;
      text-transform:uppercase;
      line-height:1;
      -webkit-font-smoothing:antialiased;
      -moz-osx-font-smoothing:grayscale;
    }
    .card .grid .gol span{
      letter-spacing: 2px !important;
      font-kerning: none !important;
    }
    .goal-balls{
      display:inline-flex;
      align-items:center;
      gap:15px;
      margin-left:18px;
      flex:0 0 auto;
    }
    .goal-ball{
      width:78px;
      height:78px;
      overflow:visible;
    }
    .goal-ball circle,
    .goal-ball path{
      fill:none;
      stroke:#fff;
      stroke-width:4px;
      stroke-linecap:round;
      stroke-linejoin:round;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logoback">
      <img src="${golBaseUrl}/logo.png" alt="" />
    </div>
    <div class="main-text">
      <svg viewBox="0 0 980 678" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goal-title-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="980" y2="0">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="49.9%" stop-color="#ffffff" />
            <stop offset="50%" stop-color="#e12121" />
            <stop offset="100%" stop-color="#e12121" />
          </linearGradient>
        </defs>
        <path d="M91.8406 644.597C84.7212 666.866 70.4823 678 49.124 678C33.9359 677.526 21.8329 671.841 12.815 660.943C4.27165 649.572 0 633.463 0 612.616V72.4906C0 49.2746 6.17017 31.5074 18.5105 19.1887C30.8508 6.39623 48.8867 0 72.6181 0C119.606 0 143.1 22.2684 143.1 66.8051V285.698H89.7048V68.2264C89.7048 54.0126 83.7719 46.9057 71.9062 46.9057C60.0405 46.9057 54.1076 54.0126 54.1076 68.2264V609.774C54.1076 623.987 60.0405 631.094 71.9062 631.094C77.1271 631.094 81.3988 629.199 84.7212 625.409C88.0436 621.145 89.7048 615.933 89.7048 609.774V366.006H70.4823V319.101H142.389V674.447H104.656L95.4003 644.597H91.8406Z" fill="white"/>
        <path d="M173.814 72.4906C173.814 24.1635 197.783 0 245.72 0C293.658 0 317.626 24.1635 317.626 72.4906V604.088C317.626 627.778 311.456 646.019 299.116 658.811C286.776 671.604 268.977 678 245.72 678C222.464 678 204.665 671.604 192.325 658.811C179.984 646.019 173.814 627.778 173.814 604.088V72.4906ZM263.519 609.063V68.2264C263.519 54.0126 257.586 46.9057 245.72 46.9057C233.855 46.9057 227.922 54.0126 227.922 68.2264V609.063C227.922 623.75 233.855 631.094 245.72 631.094C250.941 631.094 255.213 629.199 258.535 625.409C261.858 621.145 263.519 615.696 263.519 609.063Z" fill="white"/>
        <path d="M349.019 72.4906C349.019 24.1635 372.987 0 420.925 0C468.862 0 492.831 24.1635 492.831 72.4906V604.088C492.831 627.778 486.661 646.019 474.321 658.811C461.98 671.604 444.182 678 420.925 678C397.668 678 379.87 671.604 367.529 658.811C355.189 646.019 349.019 627.778 349.019 604.088V72.4906ZM438.723 609.063V68.2264C438.723 54.0126 432.791 46.9057 420.925 46.9057C409.059 46.9057 403.126 54.0126 403.126 68.2264V609.063C403.126 623.75 409.059 631.094 420.925 631.094C426.146 631.094 430.417 629.199 433.74 625.409C437.062 621.145 438.723 615.696 438.723 609.063Z" fill="white"/>
        <path d="M524.223 72.4906C524.223 24.1635 548.192 0 596.13 0C644.067 0 668.036 24.1635 668.036 72.4906V604.088C668.036 627.778 661.866 646.019 649.525 658.811C637.185 671.604 619.386 678 596.13 678C572.873 678 555.074 671.604 542.734 658.811C530.393 646.019 524.223 627.778 524.223 604.088V72.4906ZM613.928 609.063V68.2264C613.928 54.0126 607.995 46.9057 596.13 46.9057C584.264 46.9057 578.331 54.0126 578.331 68.2264V609.063C578.331 623.75 584.264 631.094 596.13 631.094C601.35 631.094 605.622 629.199 608.944 625.409C612.267 621.145 613.928 615.696 613.928 609.063Z" fill="white"/>
        <path d="M699.428 72.4906C699.428 24.1635 723.397 0 771.334 0C819.272 0 843.24 24.1635 843.24 72.4906V604.088C843.24 627.778 837.07 646.019 824.73 658.811C812.39 671.604 794.591 678 771.334 678C748.077 678 730.279 671.604 717.938 658.811C705.598 646.019 699.428 627.778 699.428 604.088V72.4906ZM789.133 609.063V68.2264C789.133 54.0126 783.2 46.9057 771.334 46.9057C759.468 46.9057 753.536 54.0126 753.536 68.2264V609.063C753.536 623.75 759.468 631.094 771.334 631.094C776.555 631.094 780.827 629.199 784.149 625.409C787.471 621.145 789.133 615.696 789.133 609.063Z" fill="white"/>
        <path d="M929.452 626.83H980V674.447H876.768V2.84277H929.452V626.83Z" fill="white"/>
      </svg>
    </div>
    <div class="player">
      <img src="${absolutePlayerImageUrl}" alt="${escapeHtml(playerName)}" />
    </div>
    ${milestoneMarkup}
    
    <div class="grid">
      <div class="result">
        <span>${homeScore}</span>
        <span class="squ">${escapeHtml(homeTeam.toUpperCase())}</span>
      </div>
      <div class="result">
        <span>${awayScore}</span>
        <span class="squ">${escapeHtml(awayTeam.toUpperCase())}</span>
      </div>
      <div class="gol">
        <span style="letter-spacing: 2px !important; font-kerning: none !important;">${minuteGoal}'</span>
        <span style="letter-spacing: 2px !important; font-kerning: none !important;">${escapeHtml(playerName.toUpperCase())}</span>
        ${goalBallsMarkup}
      </div>
    </div>
    
  </div>
</body>
</html>`;

    return responsePng(await renderer(htmlTemplate, { width: 1440, height: 2560 }));
  } catch (error) {
    return handleError(error, context?.awsRequestId);
  }
};

exports.createHandler = createHandler;
exports.handler = createHandler();

