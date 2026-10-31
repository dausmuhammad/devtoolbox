import test from "node:test";
import assert from "node:assert/strict";
import {
  formatJson,
  encodeBase64,
  decodeBase64,
  decodeJwt,
  convertCase,
  generatePassword,
  timestampDate,
  colorFormats,
} from "../src/lib/transforms.js";
import { searchTools } from "../src/lib/tools.js";
test("JSON format, minify, invalid input", () => {
  assert.equal(formatJson('{"a":1}', true), '{"a":1}');
  assert.match(formatJson('{"a":1}'), /\n/);
  assert.throws(() => formatJson('{"a":}'));
});
test("Base64 preserves Unicode and rejects damaged bytes", () => {
  const text = "Halo 世界 👋";
  assert.equal(decodeBase64(encodeBase64(text)), text);
  assert.throws(() => decodeBase64("%%%"));
  assert.throws(() => decodeBase64("/w=="));
});
test("JWT handles URL safe payload and malformed token", () => {
  const h = encodeBase64('{"alg":"none"}');
  const p = encodeBase64('{"sub":"user","exp":1700000000}');
  assert.equal(decodeJwt(`${h}.${p}.signature`).payload.sub, "user");
  assert.throws(() => decodeJwt("broken"));
  assert.throws(() => decodeJwt("a.b.c"));
});
test("Case converter separates acronyms and words", () => {
  assert.equal(convertCase("helloWorld API", "snake_case"), "hello_world_api");
  assert.equal(convertCase("hello-world", "PascalCase"), "HelloWorld");
  assert.equal(convertCase("Hello developer", "camelCase"), "helloDeveloper");
});
test("Password includes all selected groups, validates and uses requested length", () => {
  for (let i = 0; i < 30; i++) {
    const p = generatePassword(20, ["ABC", "xyz", "123", "!@"]);
    assert.equal(p.length, 20);
    for (const re of [/[ABC]/, /[xyz]/, /[123]/, /[!@]/]) assert.match(p, re);
  }
  assert.throws(() => generatePassword(20, []));
  assert.throws(() => generatePassword(2, ["a", "b", "c"]));
});
test("Timestamp units and invalid dates", () => {
  assert.equal(
    timestampDate("1700000000", "seconds").toISOString(),
    timestampDate("1700000000000", "milliseconds").toISOString(),
  );
  assert.equal(timestampDate("0", "seconds").getUTCFullYear(), 1970);
  assert.throws(() => timestampDate("abc", "seconds"));
  assert.throws(() => timestampDate("999999999999999999999", "seconds"));
});
test("Color formats and boundaries", () => {
  assert.equal(colorFormats("#fff").rgb, "rgb(255, 255, 255)");
  assert.equal(colorFormats("hsl(0, 100%, 50%)").hex, "#ff0000");
  assert.equal(colorFormats("rgb(0, 255, 0)").hsl, "hsl(120, 100%, 50%)");
  assert.throws(() => colorFormats("rgb(256, 0, 0)"));
  assert.throws(() => colorFormats("no color"));
});
test("Search includes keywords and categories", () => {
  assert.equal(searchTools("sha256")[0].slug, "hash");
  assert.ok(searchTools("generator").length >= 3);
});
import { readFileSync } from "node:fs";
import { Worker } from "node:worker_threads";
const workerSource = readFileSync(
  new URL("../public/regex-worker.js", import.meta.url),
  "utf8",
);
function regexWorker(pattern, flags, text, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      `const {parentPort}=require('node:worker_threads');const self={postMessage:value=>parentPort.postMessage(value)};${workerSource};parentPort.on('message',data=>self.onmessage({data}));`,
      { eval: true },
    );
    const timer = setTimeout(() => {
      void worker.terminate();
      reject(new Error("timeout"));
    }, timeout);
    worker.once("message", (result) => {
      clearTimeout(timer);
      void worker.terminate();
      resolve(result);
    });
    worker.once("error", (e) => {
      clearTimeout(timer);
      void worker.terminate();
      reject(e);
    });
    worker.postMessage({ pattern, flags, text });
  });
}
test("Regex worker returns positions and capture groups", async () => {
  const r = await regexWorker("(dev)(\\d+)", "g", "dev12 dev34");
  assert.equal(r.matches?.length, 2);
  assert.deepEqual(r.matches?.[0].groups, ["dev", "12"]);
  assert.equal(r.matches?.[1].index, 6);
});
test("Regex worker rejects invalid pattern and flags", async () => {
  assert.ok((await regexWorker("[", "g", "")).error);
  assert.ok((await regexWorker("x", "gg", "x")).error);
});
test("Regex worker handles empty Unicode matches and caps results", async () => {
  const r = await regexWorker("(?:)", "gu", "👋");
  assert.deepEqual(
    r.matches?.map((m) => m.index),
    [0, 2],
  );
  assert.equal(
    (await regexWorker("a", "g", "a".repeat(3000))).matches?.length,
    2000,
  );
});
test("Heavy regex can be terminated without blocking caller", async () => {
  await assert.rejects(
    regexWorker("(a+)+$", "g", "a".repeat(100) + "!", 150),
    /timeout/,
  );
});
test("URI modes and malformed percent escapes", () => {
  assert.equal(
    encodeURI("https://test.dev/?q=halo dunia"),
    "https://test.dev/?q=halo%20dunia",
  );
  assert.equal(
    decodeURIComponent(encodeURIComponent("halo 👋&?")),
    "halo 👋&?",
  );
  assert.throws(() => decodeURIComponent("%E0%A4"));
});
test("Web Crypto digest and UUID standards", async () => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode("abc"),
  );
  assert.equal(
    Buffer.from(digest).toString("hex"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.match(
    crypto.randomUUID(),
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
});
test("Invalid numeric HSL cannot create NaN colors", () => {
  assert.throws(() => colorFormats("hsl(., 20%, 50%)"));
});
