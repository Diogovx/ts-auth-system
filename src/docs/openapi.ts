export const openApiDocument = {
  openapi: "3.0.0",
  info: {
    title: "Auth System API",
    version: "1.0.0",
    description: "Sistema de autenticação completo: JWT + refresh token, RBAC, rate limiting e logs de login.",
  },
  servers: [{ url: "/api" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      RegisterInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password", minLength: 8 },
          name: { type: "string" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              name: { type: "string", nullable: true },
              role: { type: "string", enum: ["USER", "ADMIN"] },
            },
          },
          accessToken: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Cria uma nova conta de usuário",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterInput" } } },
        },
        responses: {
          "201": {
            description: "Usuário criado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          "409": { description: "E-mail já cadastrado" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Autentica um usuário",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } } },
        },
        responses: {
          "200": {
            description: "Login bem-sucedido",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          "401": { description: "Credenciais inválidas" },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotaciona o refresh token (via cookie httpOnly) e emite um novo access token",
        responses: {
          "200": {
            description: "Tokens renovados",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          "401": { description: "Refresh token ausente, inválido ou expirado" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Revoga o refresh token atual e limpa o cookie",
        responses: { "204": { description: "Logout realizado" } },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Retorna o perfil do usuário autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Perfil do usuário" },
          "401": { description: "Não autenticado" },
        },
      },
    },
    "/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "Lista todos os usuários (apenas ADMIN)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Lista de usuários" },
          "403": { description: "Sem permissão" },
        },
      },
    },
    "/admin/login-logs": {
      get: {
        tags: ["Admin"],
        summary: "Lista o histórico de tentativas de login (apenas ADMIN)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Lista de logs de login" },
          "403": { description: "Sem permissão" },
        },
      },
    },
  },
};
