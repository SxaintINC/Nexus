import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const env = fs.readFileSync("supabase.local", "utf8");
const dbUrl = env.match(/^DB_URL=(.*)$/m)?.[1]?.trim();
if (!dbUrl) {
  console.error("NO DB_URL in supabase.local");
  process.exit(1);
}

const dir = "supabase/migrations";
const files = fs
  .existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
  : [];

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

await client.query(`create table if not exists schema_migrations (
  filename text primary key,
  applied_at timestamptz not null default now()
)`);

const { rows } = await client.query("select filename from schema_migrations");
const applied = new Set(rows.map((r) => r.filename));

let did = 0;
for (const f of files) {
  if (applied.has(f)) {
    console.log("skip  ", f, "(already applied)");
    continue;
  }
  const sql = fs.readFileSync(path.join(dir, f), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into schema_migrations (filename) values ($1)", [f]);
    await client.query("commit");
    console.log("apply ", f);
    did++;
  } catch (e) {
    await client.query("rollback");
    console.error("FAILED", f, "→", e.message);
    process.exit(1);
  }
}
if (!did) console.log("nothing to apply");
await client.end();
