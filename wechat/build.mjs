import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('.', import.meta.url));
for (const script of ['prepare_media.py', 'publish.py', 'verify.py']) {
  execFileSync('python3', [script], { cwd, stdio: 'inherit' });
}
