# Auth System — JWT + Refresh Token + RBAC

Sistema de autenticação completo em **Node.js + TypeScript**, com access/refresh token, controle de acesso por papéis (roles), rate limiting e logs de login para auditoria.

<p align="center">
  <img src="https://github.com/SEU_USUARIO/auth-system/actions/workflows/ci.yml/badge.svg">
  <img src="https://img.shields.io/badge/node-20.x-339933?logo=node.js&logoColor=white">
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white">
  <img src="https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma&logoColor=white">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white">
  <img src="https://img.shields.io/badge/license-MIT-green">
</p>

## 🧩 Como funciona

![Fluxo de autenticação](docs/auth-flow-diagram.svg)

- **Access token (JWT)** — vida curta (15 min por padrão). Vai no header `Authorization: Bearer <token>`, é verificado localmente (sem consultar o banco) e carrega `sub` (id do usuário), `email` e `role`.
- **Refresh token** — uma string aleatória opaca (não é JWT), entregue em um **cookie `httpOnly`** escopado para `/api/auth`. No banco, só guardamos o **hash SHA-256** dele — nunca o valor em texto puro.
- **Rotação de refresh token** — a cada `/api/auth/refresh`, o token usado é revogado e um novo é emitido (transação atômica no banco). Isso limita a janela de uso de um token vazado.
- **Detecção de reuso** — se um refresh token **já revogado** for apresentado novamente (sinal clássico de token roubado sendo usado em paralelo), a API revoga **todas** as sessões daquele usuário imediatamente.
- **RBAC** — cada usuário tem uma `role` (`USER` ou `ADMIN`). O middleware `authorize(...roles)` protege rotas administrativas.
- **Rate limiting** — limite global brando em toda a API, e um limite bem mais rígido especificamente em `/login` e `/register` (principal defesa contra força bruta).
- **Logs de login** — toda tentativa de login (sucesso ou falha) é registrada em `LoginLog` com e-mail tentado, IP, user-agent e resultado — dá pra auditar ataques de força bruta depois.

## 🛠️ Stack

- **Node.js + TypeScript**
- **Express** — API HTTP
- **Prisma ORM** + **PostgreSQL**
- **argon2** — hashing de senha (Argon2id, recomendação atual da OWASP)
- **jsonwebtoken** — access tokens
- **zod** — validação de entrada
- **express-rate-limit**, **helmet**, **cors**, **morgan**
- **Swagger UI** — documentação interativa em `/docs`
- **Vitest** — testes unitários
- **Docker / Docker Compose**

## 📂 Estrutura do projeto

```
src/
├── config/env.ts             # variáveis de ambiente centralizadas
├── lib/prisma.ts             # instância singleton do Prisma Client
├── utils/
│   ├── password.ts           # hash/verificação com argon2
│   ├── jwt.ts                # assinatura/verificação do access token
│   ├── refreshToken.ts       # geração e hash do refresh token
│   └── cookies.ts            # cookie httpOnly do refresh token
├── middlewares/
│   ├── authenticate.ts       # valida o access token (Bearer)
│   ├── authorize.ts          # RBAC — exige role específica
│   ├── rateLimiters.ts       # limites global e de auth
│   ├── validate.ts           # valida body/query/params com zod
│   └── errorHandler.ts       # tratamento de erro centralizado
├── modules/
│   ├── auth/                 # register, login, refresh, logout
│   ├── users/                # GET /me
│   └── admin/                # rotas só para ADMIN (usuários, logs)
├── docs/openapi.ts           # especificação OpenAPI (Swagger)
├── app.ts                    # monta a aplicação Express
└── server.ts                  # ponto de entrada

prisma/
├── schema.prisma             # modelos User, RefreshToken, LoginLog
└── seed.ts                    # cria um usuário ADMIN inicial

tests/                         # testes unitários (Vitest)
docs/auth-flow-diagram.svg     # diagrama do fluxo de tokens
```

## 🚀 Rodando localmente

### Pré-requisitos

- Node.js 20+
- PostgreSQL (local ou via Docker)

### Passos

```bash
npm install
cp .env.example .env
# edite o .env — principalmente JWT_ACCESS_SECRET e DATABASE_URL

npm run prisma:migrate     # cria as tabelas
npm run prisma:seed        # cria o usuário admin inicial (ver .env)

npm run dev                # sobe a API em http://localhost:3000
```

Documentação interativa (Swagger UI): `http://localhost:3000/docs`

## 🐳 Rodando com Docker

```bash
docker compose up --build
```

Sobe a API + Postgres juntos. Depois, rode as migrations e o seed dentro do container se quiser o admin inicial:

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```

## 📡 Endpoints principais

| Método | Rota                     | Autenticação      | Descrição                                          |
|--------|---------------------------|--------------------|------------------------------------------------------|
| POST   | `/api/auth/register`      | —                  | Cria uma nova conta (role `USER`)                    |
| POST   | `/api/auth/login`         | —                  | Autentica e retorna access token + cookie de refresh |
| POST   | `/api/auth/refresh`       | Cookie refreshToken| Rotaciona o refresh token e emite novo access token  |
| POST   | `/api/auth/logout`        | Cookie refreshToken| Revoga o refresh token atual                          |
| GET    | `/api/users/me`           | Bearer accessToken | Perfil do usuário autenticado                         |
| GET    | `/api/admin/users`        | Bearer + role ADMIN| Lista todos os usuários                               |
| GET    | `/api/admin/login-logs`   | Bearer + role ADMIN| Histórico de tentativas de login                      |
| GET    | `/health`                 | —                  | Health check                                           |

### Exemplo — registro

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@example.com", "password": "SenhaForte123", "name": "Fulano"}'
```

### Exemplo — login (guardando o cookie para reuso)

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@example.com", "password": "SenhaForte123"}'
```

### Exemplo — rota protegida

```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_AQUI"
```

### Exemplo — refresh (usando o cookie salvo)

```bash
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/refresh
```

## 🔐 Decisões de segurança

- **Argon2id em vez de bcrypt** para hashing de senha — resistente a ataques com GPU/ASIC, é a recomendação atual da OWASP.
- **Refresh token nunca é armazenado em texto puro** — só o hash SHA-256 fica no banco; um vazamento do banco não expõe tokens válidos.
- **Cookie `httpOnly` + `sameSite: strict` + escopado a `/api/auth`** — inacessível via JavaScript (mitiga XSS) e não é enviado em requisições cross-site.
- **Rotação + detecção de reuso de refresh token** — mesmo que um token vaze, o uso dele pelo atacante em paralelo com o legítimo aciona a revogação de toda a sessão.
- **Rate limiting mais agressivo em login/registro** — mitiga força bruta e criação em massa de contas.
- **Logs de login persistidos** — permite auditoria e detecção de padrões suspeitos depois do fato.
- **Senha nunca aparece em nenhuma resposta da API** — os `select` do Prisma sempre omitem `passwordHash`.

## 🧪 Testes

```bash
npm test
```

Cobre a lógica pura (hashing de senha, geração/hash de refresh token, assinatura/verificação de JWT). Os testes de integração das rotas (register → login → refresh → logout) ficam como próximo passo natural, usando um banco de teste (o workflow de CI já sobe um Postgres via serviço, pronto para isso).

## 🔭 Próximos passos (ideias de evolução)

- Testes de integração ponta a ponta (supertest) cobrindo o fluxo completo de auth
- Verificação de e-mail no cadastro
- Fluxo de "esqueci minha senha"
- Login social (OAuth2 — Google/GitHub)
- 2FA (TOTP)
- Endpoint para o usuário listar/revogar suas próprias sessões ativas

## 📄 Licença

MIT
