import { buildApp } from "./app";
import { env } from "./config/env";

const app = buildApp();

app.listen(env.port, () => {
  console.log(`🚀 API rodando em http://localhost:${env.port}`);
  console.log(`📚 Documentação Swagger em http://localhost:${env.port}/docs`);
});
