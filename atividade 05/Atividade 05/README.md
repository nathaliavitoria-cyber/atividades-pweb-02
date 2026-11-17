# Atividade 05 - Upload de arquivos e envio de e-mail

Frontend (React + Vite) e banco (PostgreSQL) do professor, com o backend NestJS (`backend-final`) que recebe anexos
(Supabase Storage e disco) e envia e-mail (Resend).

```
Atividade 05/
├── frontend/           (do professor, sem alterações)
├── docker-compose.yml  (do professor)
└── backend-final/      (API NestJS)
```

## Antes de rodar
Docker Desktop aberto, Node.js 20+, conta no Supabase e conta no Resend.

### Supabase
1. Crie um projeto. Em **Storage**, crie o bucket `anexos` com **Public bucket** ligado.
2. Copie a **Project URL** (termina em `.supabase.co`, sem `/rest/v1/`) e a chave **service_role** / secret
   (nunca a `anon`/publishable).

### Resend
1. Crie a conta e, em **API Keys**, uma chave com **Sending access** (`re_...`, aparece uma vez).
2. Sem domínio verificado, o Resend só entrega para o e-mail da própria conta: cadastre o usuário do sistema com esse e-mail.

## Como rodar
1. Na pasta `Atividade 05`: `docker compose up -d db`
   (se aparecer "container name already in use", rode `docker rm -f web2-todo-db web2-todo-auth-frontend` e repita).
2. `cd backend-final`
3. Copie `.env.example` para `.env` (PowerShell: `Copy-Item .env.example .env`) e preencha. Reinicie a API sempre que mudar o `.env`.
4. `npm install`, `npm run migration:run` e `npm run start:dev` (API em http://localhost:3000/api).
5. Em outro terminal: `cd frontend`, `npm install`, `npm run dev` e abra http://localhost:5173.
6. Crie uma conta (e-mail da conta do Resend), crie uma tarefa (chega o e-mail) e anexe um arquivo pelo clipe.

## Rotas novas
| Método | Rota | O que faz |
| ------ | ---- | --------- |
| POST | /api/tarefas/:id/anexo | multipart, campo `arquivo`; valida e envia ao bucket; salva a URL em `anexoUrl` |
| POST | /api/tarefas/:id/anexo-disco | seção 4 da aula: salva em `./uploads` e serve em `/uploads/<nome>` |
| POST | /api/tarefas | cria a tarefa e dispara o e-mail em segundo plano |

## Regras do upload
Até 5 MB; png, jpg, webp, gif e pdf (tipo conferido pelo conteúdo); nome aleatório (UUID).
Erros: sem cookie 401, arquivo grande ou tipo inválido 400 (no disco, arquivo grande dá 413), tarefa inexistente 404,
sem `.env` do Supabase 500 com mensagem clara.

## Problemas comuns
- `fetch failed` ao anexar: `SUPABASE_URL` errada (exemplo `xxxx` ou `/rest/v1/` no final).
- `Bucket not found`: nome do bucket diferente de `SUPABASE_BUCKET`.
- `Invalid API key`: usou a chave `anon` em vez da `service_role`.
- `ECONNREFUSED` ao iniciar a API: banco parado; abra o Docker e rode `docker compose up -d db`.
- E-mail não chega: veja `Falha ao enviar e-mail` no terminal da API e *Emails → Logs* no Resend.
