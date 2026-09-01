# Pubblicazione diretta delle Instagram Stories

## Architettura e costi

Il frontend invia il PNG generato alla Function URL `instagram-story-publisher`. La Lambda verifica un PIN, converte il file in JPEG 1080×1920, lo deposita temporaneamente nel bucket privato e chiede a Meta di pubblicarlo come Storia.

Prima della pubblicazione la Lambda verifica che ID e username restituiti da Meta corrispondano a `@polisportiva.casalpoglio`. L’elaborazione resta sincrona e può attendere Meta fino a cinque minuti, senza introdurre code o altri servizi AWS.

- Nessun API Gateway, database, Secrets Manager o allarme CloudWatch.
- Un solo parametro SSM Standard SecureString.
- Gli oggetti temporanei sotto `instagram-stories/` scadono dopo un giorno.
- Log conservati per tre giorni e concorrenza Lambda limitata a due.

Con il volume previsto il carico rimane normalmente nei free tier AWS; restano possibili costi minimi se si superano le soglie gratuite di Lambda, S3 o trasferimento dati.

## Dati riservati

Non inviare mai token Instagram, password, chiave segreta Meta o PIN in chat, email, commit, variabili Vite o Render. Il browser invia il PIN soltanto quando si conferma una pubblicazione e non lo salva.

Il parametro SSM `/casalpoglio/instagram-publisher` contiene un JSON con questa struttura:

```json
{
  "accessToken": "TOKEN_META",
  "instagramAccountId": "ID_ACCOUNT_INSTAGRAM",
  "pinSalt": "SALT_GENERATO",
  "pinHash": "HASH_GENERATO"
}
```

Deve essere di tipo **SecureString**, tier **Standard**, nella regione `eu-west-1`, con la chiave AWS gestita `alias/aws/ssm`.

## Prima attivazione

1. Effettuare il deploy dello stack `casalpoglio-instagram-publisher` con `PublishingEnabled=false`.
2. In Meta for Developers aprire `PolCasalpoglio` → Casi d'uso → API Instagram → Configurazione dell'API con Instagram Login → Genera token d'accesso.
3. Autorizzare `@polisportiva.casalpoglio` con almeno `instagram_business_basic` e `instagram_business_content_publish`. Per l'uso in modalità sviluppo, l'account deve risultare Tester di Instagram attivo.
4. Conservare il token in un password manager e annotare l'ID numerico dell'account Instagram mostrato dal flusso. Non copiare questi dati nel repository.
5. Dal terminale nella root del progetto eseguire `node scripts/hash-instagram-pin.mjs`. Digitare un PIN numerico di 8–16 cifre: il terminale non lo mostra. Conservare il PIN nel password manager e copiare soltanto `pinSalt` e `pinHash`.
6. Nella console AWS creare il parametro SecureString con il JSON indicato sopra.
7. Impostare le repository variables GitHub `INSTAGRAM_PUBLISHING_ENABLED=true` e `INSTAGRAM_EXPECTED_USERNAME=polisportiva.casalpoglio`, quindi rilanciare manualmente il workflow **Deploy Instagram story publisher**.
8. Copiare l'output CloudFormation `InstagramStoryPublisherUrl` in Render come `VITE_INSTAGRAM_PUBLISH_URL` e avviare un deploy del frontend.
9. Generare una grafica di prova, pubblicarla con il PIN e controllare subito la Storia su Instagram.

L'app Meta può restare in modalità sviluppo finché pubblica soltanto per l'account tester configurato. La pubblicazione dell'app e l'App Review servono prima di autorizzare account Instagram esterni.

## Sicurezza e comportamento

- La Function URL è tecnicamente pubblica, ma accetta soltanto richieste provenienti dal browser Render via CORS e richiede PIN.
- CORS non protegge invocazioni fatte fuori dal browser: il PIN lungo, la conferma e la concorrenza limitata sono protezioni intenzionali per questo strumento interno.
- Il browser calcola SHA-256 del PNG e conserva per 24 ore in `sessionStorage` soltanto chiave, stato, media ID e timestamp del tentativo. PIN e token non vengono memorizzati.
- Gli stati S3 usano scritture condizionali: un solo processo può acquisire o recuperare un tentativo. Un `PROCESSING` può essere recuperato dopo sette minuti; `UNKNOWN` non viene mai riprovato automaticamente.
- Retry, refresh e rigenerazione della stessa grafica riutilizzano la medesima chiave. Una nuova chiave viene creata soltanto dal comando esplicito **Pubblica di nuovo**.
- Se l’esito Meta diventa incerto dopo il comando di pubblicazione, l’app chiede di controllare Instagram prima di consentire un nuovo tentativo volontario.
- Meta viene interrogato subito e poi una volta al minuto, per non più di cinque minuti.
- Il token viene inviato a Meta tramite header Bearer e non appare negli URL applicativi.

## Rinnovo e disattivazione

Controllare la scadenza indicata da Meta quando si genera il token. Prima della scadenza, generare un nuovo token e sostituire esclusivamente `accessToken` nel parametro SSM; la Lambda rilegge la configurazione entro cinque minuti.

Per una disattivazione immediata impostare `INSTAGRAM_PUBLISHING_ENABLED=false` e rilanciare il workflow dedicato. Per nascondere anche il comando nell'app, rimuovere `VITE_INSTAGRAM_PUBLISH_URL` da Render e ridistribuire.
