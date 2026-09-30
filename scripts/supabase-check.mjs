import fs from "node:fs";
import pg from "pg";

const env = fs.readFileSync("supabase.local", "utf8");
const dbUrl = env.match(/^DB_URL=(.*)$/m)?.[1]?.trim();
if (!dbUrl) {
  console.error("NO DB_URL");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const who = await client.query(
    "select current_user, current_database(), version()",
  );
  console.log("connected as:", who.rows[0].current_user);
  console.log("database     :", who.rows[0].current_database);

  const tables = await client.query(
    `select tablename from pg_tables
     where schemaname = 'public' order by tablename`,
  );
  console.log(
    "public tables:",
    tables.rows.length ? tables.rows.map((r) => r.tablename).join(", ") : "(none)",
  );

  await client.query("create table if not exists _buffy_ping (t timestamptz default now())");
  await client.query("drop table _buffy_ping");
  console.log("DDL test     : CREATE/DROP OK — full schema access confirmed");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
