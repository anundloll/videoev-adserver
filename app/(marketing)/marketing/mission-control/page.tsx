import MissionControl from "../MissionControl";

// ─── Server component — reads env vars and passes masked values down ──────────
// DATABASE_URL never reaches the client; only a display-safe string does.

function maskDatabaseUrl(raw: string | undefined): string {
  if (!raw) return "DATABASE_URL not set";
  try {
    const url = new URL(raw);
    return `${url.protocol}//${url.username}:***@${url.host}${url.pathname}`;
  } catch {
    return "postgresql://***:***@[masked]";
  }
}

export default function MissionControlPage() {
  const maskedDb  = maskDatabaseUrl(process.env.DATABASE_URL);
  const vercelEnv = process.env.VERCEL_ENV ?? "local";
  const region    = process.env.VERCEL_REGION ?? "localhost";

  return (
    <MissionControl
      maskedDb={maskedDb}
      vercelEnv={vercelEnv}
      region={region}
    />
  );
}
