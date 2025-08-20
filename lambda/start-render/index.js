const {renderMediaOnLambda} = require('@remotion/lambda/client');
const {getOrCreateBucket} = require('@remotion/lambda');

exports.handler = async (event) => {
  try {
    const payload = event && event.body ? JSON.parse(event.body) : {};
    const {
      composition,
      compositionId,
      inputProps = {},
      outName,
      codec = 'h264',
      jpegQuality = 80,
      frameRange,
      numberOfGifLoops,
      audioBitrate,
      videoBitrate,
      crf,
      pixelFormat,
      audioCodec,
      videoCodec,
      height,
      width,
      fps,
      durationInFrames,
    } = payload;

    const REGION = process.env.AWS_REGION || 'eu-west-1';
    const FUNCTION_NAME = process.env.REMOTION_LAMBDA_FUNCTION_NAME;
    const SERVE_URL = process.env.REMOTION_SERVE_URL;
    const SITE_NAME = process.env.REMOTION_SITE_NAME;
    const DEFAULT_COMP = process.env.DEFAULT_COMPOSITION_ID || 'GoalComp';

    // Bucket per asset dinamici passati come chiavi (es. players/7.png)
    const ASSET_BUCKET = process.env.ASSET_BUCKET;

    // Helper: controlla se una stringa è una URL assoluta
    const isAbsoluteUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);

    // Normalizza i props: se s3PlayerUrl o overlayImage sono chiavi S3, trasformale in URL complete
    let mergedProps = { ...inputProps };
    
    console.log('🎯 Lambda received inputProps:', JSON.stringify(inputProps, null, 2));
    
    // Convert FinalResultComp data format if needed
    if (compositionId === 'FinalResultComp' && inputProps.homeTeam && inputProps.awayTeam) {
      console.log('🔄 Converting FinalResultComp data format...');
      
      // Helper function to get team info
      const getTeamInfo = (teamId) => {
        const teamNames = {
          'casalpoglio': 'Casalpoglio',
          'amatori_club': 'Amatori Club',
          'team_3': 'Team 3',
          'team_4': 'Team 4'
        };
        
        const teamLogos = {
          'casalpoglio': 'logo_casalpoglio.png',
          'amatori_club': 'logo_amatori_club.png',
          'team_3': 'logo192.png',
          'team_4': 'logo192.png'
        };
        
        return {
          name: teamNames[teamId] || teamId,
          logo: teamLogos[teamId] || 'logo192.png'
        };
      };
      
      // Helper function to get player surname by ID
      const getPlayerSurname = (playerId) => {
        // Complete player mapping from players.ts with surnames only
        const playerSurnames = {
          'davide_fava': 'Fava',
          'lorenzo_campagnari': 'Campagnari',
          'davide_scalmana': 'Scalmana',
          'saif_ardhaoui': 'Ardhaoui',
          'nicolo_castellini': 'Castellini',
          'andrea_contesini': 'Contesini',
          'davide_di_roberto': 'Di Roberto',
          'francesco_gabusi': 'Gabusi',
          'massimiliano_gandellini': 'Gandellini',
          'lorenzo_gobbi': 'Gobbi',
          'antonio_inglese': 'Inglese',
          'vase_jakimovski': 'Jakimovski',
          'filippo_lodetti': 'Lodetti',
          'braian_marchi': 'Marchi',
          'vincenzo_marino': 'Marino',
          'rosario_nastasi': 'Nastasi',
          'david_perosi': 'Perosi',
          'michael_pezzi': 'Pezzi',
          'lorenzo_piccinelli': 'Piccinelli',
          'matteo_pinelli': 'Pinelli',
          'sebastiano_pretto': 'Pretto',
          'daniele_primasso': 'Primasso',
          'cristian_ramponi': 'Ramponi',
          'fabio_rampulla': 'Rampulla',
          'daniele_rossetto': 'Rossetto',
          'andrea_serpellini': 'Serpellini',
          'davide_sipolo': 'Sipolo',
          'marco_turini': 'Turini',
          'alberto_viola': 'Viola',
        };
        return playerSurnames[playerId] || playerId;
      };
      
      // Convert the data format
      const homeTeamInfo = getTeamInfo(inputProps.homeTeam);
      const awayTeamInfo = getTeamInfo(inputProps.awayTeam);
      

      
      const isCasalpoglioHome = inputProps.homeTeam === 'casalpoglio';
      const isCasalpoglioAway = inputProps.awayTeam === 'casalpoglio';
      
      // Get scorer names with minutes for Casalpoglio
      const casalpoglioScorerNames = (inputProps.casalpoglioScorers || [])
        .map(scorer => {
          const surname = getPlayerSurname(scorer.playerId);
          const minute = scorer.minute;
          return `${surname} ${minute}'`;
        })
        .filter(name => name && name !== 'Unknown Player');
      
      // Create the converted props
      mergedProps = {
        teamA: homeTeamInfo,  // Team A is always home team
        teamB: awayTeamInfo,  // Team B is always away team
        scoreA: inputProps.score?.home || 0,   // Score A is home score
        scoreB: inputProps.score?.away || 0,   // Score B is away score
        scorers: casalpoglioScorerNames,
        casalpoglioIsHome: isCasalpoglioHome,
        casalpoglioIsAway: isCasalpoglioAway,
      };
      

    }

    const toS3Url = (val) => `https://${ASSET_BUCKET}.s3.${REGION}.amazonaws.com/${String(val).replace(/^\/+/, '')}`;

    if (mergedProps) {
      if (mergedProps.s3PlayerUrl && !isAbsoluteUrl(mergedProps.s3PlayerUrl)) {
        if (!ASSET_BUCKET) {
          console.warn('ASSET_BUCKET non impostato: s3PlayerUrl è una chiave ma non posso costruire la URL. La lascio invariata.');
        } else {
          mergedProps.s3PlayerUrl = toS3Url(mergedProps.s3PlayerUrl);
        }
      }

      if (mergedProps.overlayImage && !isAbsoluteUrl(mergedProps.overlayImage)) {
        if (!ASSET_BUCKET) {
          console.warn('ASSET_BUCKET non impostato: overlayImage è una chiave ma non posso costruire la URL. La lascio invariata.');
        } else {
          mergedProps.overlayImage = toS3Url(mergedProps.overlayImage);
        }
      }

      // UNIFIED ASSET PATTERN: Team logos are now handled by resolveAsset() in the component
      // No need to convert teamALogoPath and teamBLogoPath to S3 URLs anymore
      // The component will use resolveAsset(team.logo) which works in both local and Lambda environments
    }



    if (!FUNCTION_NAME) {
      return { 
        statusCode: 500, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing REMOTION_LAMBDA_FUNCTION_NAME' }) 
      };
    }

    const comp = composition || compositionId || DEFAULT_COMP;

    if (!SERVE_URL && !SITE_NAME) {
      return { 
        statusCode: 500, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing REMOTION_SERVE_URL or REMOTION_SITE_NAME' }) 
      };
    }

    const {bucketName} = await getOrCreateBucket({ region: REGION });

    // Configurazione avanzata per il rendering
    const options = {
      region: REGION,
      functionName: FUNCTION_NAME,
      composition: comp,
      inputProps: mergedProps,
      codec,
      outName,
      forceBucketName: bucketName,
      jpegQuality,
      audioBitrate,
      videoBitrate,
      crf,
      pixelFormat,
      audioCodec,
      videoCodec,
      height,
      width,
      fps,
      durationInFrames,
    };

    // Aggiungi opzioni condizionali
    if (frameRange) {
      options.frameRange = frameRange;
    }
    
    if (numberOfGifLoops !== undefined) {
      options.numberOfGifLoops = numberOfGifLoops;
    }

    if (SERVE_URL) {
      options.serveUrl = SERVE_URL;
    } else {
      options.siteName = SITE_NAME;
    }

    console.log('Starting render with options:', JSON.stringify(options, null, 2));

    const {renderId} = await renderMediaOnLambda(options);

    console.log(`Render started successfully with ID: ${renderId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        bucketName, 
        renderId,
        message: 'Render started successfully'
      }),
    };
  } catch (e) {
    console.error('Error in start-render lambda:', e);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: false,
        error: String(e && e.message ? e.message : e),
        stack: e.stack
      }),
    };
  }
};
