// Prepara o ambiente LOCAL antes de `npm run dev`.
// Em produção (Railway) a DATABASE_URL vem do ambiente e quem cuida do banco
// é o `npm run start:prod`.

import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(raiz, '.env');

if (!existsSync(envPath)) {
  copyFileSync(join(raiz, '.env.example'), envPath);
  const segredo = randomBytes(32).toString('base64');
  writeFileSync(envPath, readFileSync(envPath, 'utf8').replace('change-me-in-production', segredo));
  console.log('→ .env criado a partir de .env.example (com NEXTAUTH_SECRET próprio).');
}

// Local: sincroniza o schema e carrega a massa de demonstração (SEED_DEMO=1).
try {
  execSync('npx prisma db push --skip-generate', { cwd: raiz, stdio: 'pipe' });
  execSync('npx prisma db seed', { cwd: raiz, stdio: 'pipe', env: { ...process.env, SEED_DEMO: '1' } });
  console.log('→ Banco local sincronizado e massa de demonstração carregada.');
} catch {
  console.log(
    [
      '',
      '⚠  Não consegui falar com o banco de dados local.',
      '   O painel usa PostgreSQL. Suba um Postgres e ajuste a DATABASE_URL em .env.',
      '   (Para olhar os dados reais, aponte a DATABASE_URL para o banco da Railway.)',
      '',
    ].join('\n')
  );
}
