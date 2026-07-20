// Garante que testes unitários (que não tocam no banco) não quebrem por falta
// de variáveis de ambiente obrigatórias, como DATABASE_URL.
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/auth_system_test";
process.env.JWT_ACCESS_SECRET ??= "test-secret-only-for-unit-tests";
