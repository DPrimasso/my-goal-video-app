import { pbkdf2Sync, randomBytes } from 'node:crypto';

const PIN_PATTERN = /^\d{8,16}$/;

function readSecret(prompt) {
  if (!process.stdin.isTTY) throw new Error('Esegui questo comando in un terminale interattivo.');
  return new Promise((resolve, reject) => {
    let value = '';
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', onData);
      process.stdout.write('\n');
      resolve(value);
    };
    const onData = (key) => {
      if (key === '\u0003') {
        process.stdin.setRawMode(false);
        reject(new Error('Operazione annullata.'));
      } else if (key === '\r' || key === '\n') finish();
      else if (key === '\u007f' || key === '\b') value = value.slice(0, -1);
      else if (/^\d+$/.test(key) && value.length < 16) value += key;
    };
    process.stdin.on('data', onData);
  });
}

try {
  const pin = await readSecret('Scegli un PIN di pubblicazione (8-16 cifre): ');
  if (!PIN_PATTERN.test(pin)) throw new Error('Il PIN deve contenere da 8 a 16 cifre.');
  const confirmation = await readSecret('Ripeti il PIN: ');
  if (pin !== confirmation) throw new Error('I due PIN non coincidono.');
  const pinSalt = randomBytes(16).toString('base64');
  const pinHash = pbkdf2Sync(pin, Buffer.from(pinSalt, 'base64'), 210_000, 32, 'sha256').toString('hex');
  process.stdout.write(`${JSON.stringify({ pinSalt, pinHash }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
