/**
 * Cria (ou atualiza) um usuário ADMIN inicial, usando as credenciais definidas
 * em SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (veja .env.example).
 *
 * Uso: npm run prisma:seed
 */
import { PrismaClient, Role } from "@prisma/client";
import argon2 from "argon2";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN },
    create: {
      email,
      passwordHash,
      name: "Administrador",
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Usuário admin pronto: ${admin.email} (senha: ${password})`);
}

main()
  .catch((err) => {
    console.error("❌ Erro ao rodar o seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
