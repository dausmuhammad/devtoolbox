import test from "node:test";
import assert from "node:assert/strict";
import {
  headersToJson,
  jsonToHeaders,
  buildRequest,
  parseQuery,
  buildQuery,
} from "../src/lib/api-tools.js";
import {
  formatSql,
  cronSchedule,
  envToJson,
  jsonToEnv,
} from "../src/lib/backend-tools.js";
import {
  htmlEntities,
  convertCssUnit,
  boxShadow,
} from "../src/lib/frontend-tools.js";
import { tools, categories, searchTools } from "../src/lib/tools.js";
test("Headers preserve duplicates, empty values and colons", () => {
  const headers =
    "HTTP/1.1 200 OK\nSet-Cookie: a=1\nSet-Cookie: b=2\nLocation: https://example.com/a\nX-Empty:";
  const json = headersToJson(headers);
  assert.equal(JSON.parse(json).length, 4);
  assert.equal(JSON.parse(json)[1].value, "b=2");
  assert.equal(
    jsonToHeaders(json),
    headers.split("\n").slice(1).join("\n").replace("X-Empty:", "X-Empty: "),
  );
  assert.equal(
    jsonToHeaders('{"Accept":"application/json"}'),
    "Accept: application/json",
  );
});
test("Headers reject malformed names and injected newlines", () => {
  assert.throws(() => headersToJson("invalid line"));
  assert.throws(() => headersToJson("Bad name: value"));
  assert.throws(() => jsonToHeaders('{"X-Demo":"a\\r\\nInjected: yes"}'));
  assert.throws(() => jsonToHeaders("[]x"));
});
test("Request builder preserves body and escapes POSIX shell quotes", () => {
  const body = JSON.stringify({ name: "O'Reilly", message: "Halo 👋" });
  const result = buildRequest({
    url: "https://example.com/users?q=hello world",
    method: "POST",
    headers: "Content-Type: application/json\nX-ID: demo",
    body,
  });
  assert.ok(result.curl.includes("O'\\''Reilly"));
  assert.match(result.curl, / \\\n/);
  assert.ok(result.fetch.includes(JSON.stringify(body)));
  assert.ok(result.fetch.includes("https://example.com/users?q=hello%20world"));
  assert.ok(result.fetch.includes("response.ok"));
});
test("Request builder rejects invalid schemes, method and GET body", () => {
  assert.throws(() => buildRequest({ url: "javascript:alert(1)" }));
  assert.throws(() => buildRequest({ url: "example.com" }));
  assert.throws(() =>
    buildRequest({ url: "https://example.com", body: "data" }),
  );
  assert.throws(() =>
    buildRequest({ url: "https://example.com", method: "WHATEVER" }),
  );
});
test("Query parsing preserves repeated names, Unicode, empty values and plus", () => {
  const rows = parseQuery(
    "https://example.com/?q=halo+%F0%9F%91%8B&tag=a&tag=b&empty=#section",
  );
  assert.deepEqual(rows, [
    { name: "q", value: "halo 👋" },
    { name: "tag", value: "a" },
    { name: "tag", value: "b" },
    { name: "empty", value: "" },
  ]);
  const built = buildQuery(rows, "https://example.com/search?old=1#section");
  assert.equal(built.query, "q=halo+%F0%9F%91%8B&tag=a&tag=b&empty=");
  assert.ok(built.url.endsWith("&empty=#section"));
  assert.deepEqual(parseQuery(built.query), rows);
});
test("Query rejects malformed percent and UTF-8 and blank names", () => {
  assert.throws(() => parseQuery("?q=%GG"));
  assert.throws(() => parseQuery("?q=%E0%A4"));
  assert.throws(() => buildQuery([{ name: "", value: "x" }]));
  assert.throws(() => buildQuery([], "not a URL"));
});
test("SQL formatter respects dialect, quotes and comments", async () => {
  const sql =
    "select 'hello world' as label,id from users where active=true; -- demo";
  const result = await formatSql(sql, "postgresql");
  assert.match(result, /SELECT/);
  assert.match(result, /hello world/);
  assert.match(result, /-- demo/);
  assert.ok(result.includes("\n"));
  assert.match(await formatSql("select `id` from `users`", "mysql"), /`users`/);
  assert.match(await formatSql("select id from users", "sqlite"), /SELECT/);
});
test("SQL rejects empty, huge, malformed and unsupported dialect inputs", async () => {
  await assert.rejects(formatSql(""));
  await assert.rejects(formatSql("x".repeat(100001)));
  await assert.rejects(formatSql("select (", "postgresql"));
  await assert.rejects(formatSql("select 1", "invalid"));
});
test("Cron computes weekday runs in chosen IANA time zone", async () => {
  const dates = await cronSchedule(
    "0 9 * * 1-5",
    "2026-01-05T00:00:00Z",
    "Asia/Jakarta",
    3,
  );
  assert.equal(dates[0].utc, "2026-01-05T02:00:00.000Z");
  assert.equal(dates[1].utc, "2026-01-06T02:00:00.000Z");
  assert.ok(dates[0].local.includes("09"));
});
test("Cron supports optional seconds and aliases", async () => {
  assert.equal(
    (await cronSchedule("*/10 * * * * *", "2026-01-01T00:00:01Z", "UTC", 1))[0]
      .utc,
    "2026-01-01T00:00:10.000Z",
  );
  assert.equal(
    (await cronSchedule("@daily", "2026-01-01T10:00:00Z", "UTC", 1))[0].utc,
    "2026-01-02T00:00:00.000Z",
  );
});
test("Cron handles DST changes and rejects invalid fields/timezone/count", async () => {
  const dates = await cronSchedule(
    "0 9 * * *",
    "2026-03-07T15:00:00Z",
    "America/New_York",
    2,
  );
  assert.equal(dates[0].utc, "2026-03-08T13:00:00.000Z");
  await assert.rejects(cronSchedule("99 * * * *", "2026-01-01T00:00:00Z"));
  await assert.rejects(
    cronSchedule("* * * * *", "2026-01-01T00:00:00Z", "invalid/zone"),
  );
  await assert.rejects(cronSchedule("* * * * *", "invalid"));
  await assert.rejects(
    cronSchedule("* * * * *", "2026-01-01T00:00:00Z", "UTC", 21),
  );
});
test("ENV preserves comments, literal values, quotes and multiline", () => {
  const result = JSON.parse(
    envToJson(
      'export APP=demo\nPORT=3000 # port\nHASH="a#b"\nLITERAL=\'${HOME}\'\nMULTI="line1\\nline2"\nEMPTY=',
    ),
  );
  assert.equal(result.PORT, "3000");
  assert.equal(result.HASH, "a#b");
  assert.equal(result.LITERAL, "${HOME}");
  assert.equal(result.MULTI, "line1\nline2");
  assert.equal(result.EMPTY, "");
});
test("ENV JSON round trip supports escaped quotes, backslashes and Unicode", () => {
  const data = {
    TEXT: 'Halo 👋 "quoted"',
    PATH: "C:\\app\\file",
    LINES: "a\nb",
    QUOTE: "It's fine",
    __proto__: "ignored by literal",
  };
  assert.deepEqual(
    JSON.parse(envToJson(jsonToEnv(JSON.stringify(data)))),
    data,
  );
  const special = JSON.parse(envToJson("__proto__=safe"));
  assert.equal(special.__proto__, "safe");
});
test("ENV rejects duplicate keys, invalid names, unclosed quotes and non-string JSON", () => {
  for (const value of [
    "X=a\nX=b",
    "NOT VALID=x",
    'A="unclosed',
    "A='unclosed",
    "INVALID_LINE",
  ])
    assert.throws(() => envToJson(value));
  assert.throws(() => jsonToEnv('{"X":42}'));
  assert.throws(() => jsonToEnv('["a"]'));
  assert.throws(() => jsonToEnv('{"BAD-KEY":"x"}'));
});
test("HTML entities round trip Unicode and HTML without rendering it", async () => {
  const text = '<script>alert("👋")</script> & ©';
  const encoded = await htmlEntities(text, "encode");
  assert.ok(!encoded.includes("<script>"));
  assert.equal(await htmlEntities(encoded, "decode"), text);
  assert.equal(await htmlEntities("&copy; &#x1F44B;", "decode"), "© 👋");
  await assert.rejects(htmlEntities("&invalid;", "decode"));
});
test("CSS unit conversion uses separate root and parent bases", () => {
  assert.equal(convertCssUnit(24, "px", "rem", 16, 12), 1.5);
  assert.equal(convertCssUnit(2, "em", "px", 16, 12), 24);
  assert.equal(convertCssUnit(1.5, "rem", "em", 16, 12), 2);
  assert.equal(convertCssUnit(-8, "px", "rem", 16, 12), -0.5);
  assert.equal(convertCssUnit(0, "px", "rem"), 0);
  assert.throws(() => convertCssUnit("", "px", "rem"));
  assert.throws(() => convertCssUnit(1, "px", "rem", 0));
  assert.throws(() => convertCssUnit(1, "vh", "px"));
});
test("Box shadow output supports inset and validates values", () => {
  assert.equal(
    boxShadow({
      x: 1,
      y: 2,
      blur: 3,
      spread: -1,
      color: "#ff0000",
      opacity: 25,
      inset: true,
    }),
    "inset 1px 2px 3px -1px rgba(255, 0, 0, 0.25)",
  );
  assert.throws(() =>
    boxShadow({
      x: 1,
      y: 2,
      blur: -3,
      spread: 0,
      color: "#000000",
      opacity: 25,
    }),
  );
});
test("All new categories and direct tool slugs are discoverable", () => {
  assert.equal(tools.length, 27);
  for (const c of ["API Tools", "Backend Tools", "Frontend Tools"])
    assert.equal(tools.filter((t) => t.category === c).length, 3);
  assert.equal(searchTools("dotenv")[0].slug, "env-json");
  assert.ok(categories.includes("API Tools"));
  assert.equal(new Set(tools.map((t) => t.slug)).size, tools.length);
});
test("Empty CSS values are rejected rather than treated as zero", () => {
  assert.throws(() => convertCssUnit(null, "px", "rem"));
  assert.throws(() => convertCssUnit(undefined, "px", "rem"));
});
test("HEAD request uses curl head mode and cron requires an explicit offset", async () => {
  assert.ok(
    buildRequest({
      url: "https://example.com",
      method: "HEAD",
    }).curl.startsWith("curl --head"),
  );
  await assert.rejects(
    cronSchedule("* * * * *", "2026-01-01T00:00:00"),
    /zona/,
  );
});
