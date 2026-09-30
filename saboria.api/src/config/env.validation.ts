/**
 * Falla rápido al arrancar si falta una variable de entorno requerida.
 */
const REQUIRED_VARS = ['DATABASE_URL', 'JWT_SECRET'] as const;

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_VARS.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno requeridas: ${missing.join(', ')}. Revisa tu archivo .env (ver .env.example).`,
    );
  }

  return config;
}
