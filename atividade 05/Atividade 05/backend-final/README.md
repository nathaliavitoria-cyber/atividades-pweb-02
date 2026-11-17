# backend-final — Aula 06/11 (upload + e-mail)

NestJS + TypeORM + JWT em cookie, agora com upload de anexo (Supabase Storage) e e-mail (Resend).

## Como rodar

```bash
# na raiz do projeto (onde está o docker-compose.yml)
docker compose up -d db          # Postgres na 5432

cd backend-final
cp .env.example .env             # preencha SUPABASE_* e RESEND_API_KEY
npm install
npm run migration:run            # cria tarefas, usuarios e a coluna anexoUrl
npm run start:dev                # API em http://localhost:3000/api
```

Frontend: `cd frontend && npm install && npm run dev` (Vite em 5173, proxy `/api` → 3000).

## Supabase
1. Crie um projeto e, em **Storage**, um bucket **público** chamado `anexos`.
2. Copie a *Project URL* e a **service_role key** (Settings → API) para o `.env`.
   A service_role key é segredo: só no backend.

## Resend
Crie uma API key. Sem domínio próprio, o Resend só envia de `onboarding@resend.dev`
para o e-mail da **sua conta** — por isso cadastre-se no app com esse mesmo e-mail.

## Rotas novas
- `POST /api/tarefas/:id/anexo` — multipart, campo `arquivo` (png, jpg, webp, gif ou pdf, até 5 MB).
- `POST /api/tarefas/:id/anexo-disco` — seção 4 do roteiro: grava em `./uploads` (Multer `diskStorage`,
  nome UUID) e o arquivo fica acessível em `http://localhost:3000/uploads/<nome>`. Só para dev/aprendizado.
- `POST /api/tarefas` — agora dispara o e-mail "Nova tarefa criada" em segundo plano.

## Erros esperados
sem cookie → 401 · arquivo > 5 MB ou tipo inválido → 400 · tarefa inexistente → 404 ·
sem `.env` do Supabase → 500 com mensagem clara.
