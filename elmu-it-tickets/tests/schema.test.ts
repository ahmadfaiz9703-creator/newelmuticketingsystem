import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CATEGORIES, PRIORITIES, STATUSES } from "../lib/constants.ts";

const sql = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

test("every app value is allowed by the SQL CHECK constraints", () => {
  for (const v of [...CATEGORIES, ...PRIORITIES, ...STATUSES]) {
    assert.ok(sql.includes(`'${v}'`), `schema.sql is missing '${v}'`);
  }
});

test("security basics are present in the schema", () => {
  for (const t of ["profiles", "user_roles", "tickets", "ticket_notes"]) {
    assert.match(sql, new RegExp(`alter table public\\.${t}\\s+enable row level security`));
  }
  // Nobody may write to user_roles from the API.
  assert.doesNotMatch(sql, /on public\.user_roles\s+for (insert|update|delete)/);
  assert.doesNotMatch(sql, /grant [^;]*(insert|update|delete)[^;]*on public\.user_roles/);
  // Users may not edit their own email on profiles.
  assert.match(sql, /grant update \(full_name\) on public\.profiles/);
});
