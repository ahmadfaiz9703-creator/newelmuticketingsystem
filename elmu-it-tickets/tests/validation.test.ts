import test from "node:test";
import assert from "node:assert/strict";
import { validateTicketInput, cleanSearch, isUuid, isOneOf } from "../lib/validation.ts";
import { STATUSES } from "../lib/constants.ts";

const valid = {
  requester_name: "Aisha Rahman",
  department: "Faculty of Business",
  category: "Microsoft 365",
  subject: "Cannot open Outlook",
  description: "Outlook shows a sign-in error since this morning.",
  priority: "Normal",
};

test("accepts a valid ticket and trims whitespace", () => {
  const r = validateTicketInput({ ...valid, subject: "  Cannot open Outlook  " });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.data.subject, "Cannot open Outlook");
});

test("rejects short subject and description", () => {
  const r = validateTicketInput({ ...valid, subject: "Hi", description: "short" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ["description", "subject"]);
});

test("rejects unknown category and priority", () => {
  const r = validateTicketInput({ ...valid, category: "Printers", priority: "Urgent" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ["category", "priority"]);
});

test("rejects non-string input without throwing", () => {
  const r = validateTicketInput({ ...valid, subject: 42, requester_name: null });
  assert.equal(r.ok, false);
});

test("cleanSearch strips characters that could break a filter", () => {
  assert.equal(cleanSearch("ELMU-00001),status.eq.Open"), "ELMU-00001  status.eq.Open");
  assert.equal(cleanSearch(undefined), "");
  assert.equal(cleanSearch("a".repeat(200)).length, 80);
});

test("isUuid and isOneOf", () => {
  assert.equal(isUuid("123e4567-e89b-12d3-a456-426614174000"), true);
  assert.equal(isUuid("not-a-uuid"), false);
  assert.equal(isOneOf(STATUSES, "Pending"), true);
  assert.equal(isOneOf(STATUSES, "Done"), false);
});
