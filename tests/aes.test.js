import test from "node:test";
import assert from "node:assert/strict";
import { createCipheriv } from "node:crypto";
import {
  AES_TEAM_KEY,
  AES_TEAM_IV,
  encryptAes128,
  decryptAes128,
  parseCiphertext,
} from "../src/lib/aes.js";
function reference(plain) {
  const cipher = createCipheriv(
    "aes-128-cbc",
    Buffer.from(AES_TEAM_KEY, "utf8"),
    Buffer.from(AES_TEAM_IV, "utf8"),
  );
  return Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
}
test("Team AES-CBC matches independent Node implementation including PKCS#7", async () => {
  for (const plain of [
    "hello",
    '{"name":"DevToolBox","active":true}',
    "Halo 世界 👋",
    "1234567890123456",
    "",
  ]) {
    const encrypted = await encryptAes128(plain);
    const expected = reference(plain);
    assert.equal(encrypted.hex, expected.toString("hex"));
    assert.equal(encrypted.base64, expected.toString("base64"));
    assert.deepEqual(
      Buffer.from(encrypted.hex, "hex"),
      Buffer.from(encrypted.base64, "base64"),
    );
    assert.equal(await decryptAes128(encrypted.hex, "hex"), plain);
    assert.equal(await decryptAes128(encrypted.base64, "base64"), plain);
  }
});
test("Fixed team key and IV preserve formatting and produce deterministic ciphertext", async () => {
  const json = '{\n  "name": "Tim developer"\n}';
  assert.equal(
    (await encryptAes128(json)).hex,
    (await encryptAes128(json)).hex,
  );
  assert.notEqual(
    (await encryptAes128(json)).hex,
    (await encryptAes128(JSON.stringify(JSON.parse(json)))).hex,
  );
  assert.equal(
    await decryptAes128((await encryptAes128(json)).base64, "base64"),
    json,
  );
});
test("Key and IV are exactly 16 UTF-8 bytes, not hex-decoded", async () => {
  assert.equal(new TextEncoder().encode(AES_TEAM_KEY).length, 16);
  assert.equal(new TextEncoder().encode(AES_TEAM_IV).length, 16);
  await assert.rejects(encryptAes128("x", "short"), /Key.*16 byte/);
  await assert.rejects(
    encryptAes128("x", AES_TEAM_KEY, "short"),
    /IV.*16 byte/,
  );
  await assert.rejects(encryptAes128("x", "é".repeat(16)), /Key.*16 byte/);
});
test("Malformed ciphertext and invalid lengths fail clearly", async () => {
  for (const value of ["", "zz", "a", "00"])
    assert.throws(() => parseCiphertext(value, "hex"));
  for (const value of ["", "%%%", "YQ==", "===="])
    assert.throws(() => parseCiphertext(value, "base64"));
  await assert.rejects(decryptAes128("00".repeat(16), "hex"), /Decrypt gagal/);
});
test("HEX uppercase and pasted ciphertext line wraps are accepted", async () => {
  const result = await encryptAes128("Halo developer");
  assert.equal(
    await decryptAes128(result.hex.toUpperCase(), "hex"),
    "Halo developer",
  );
  assert.equal(
    await decryptAes128(
      result.base64.slice(0, 8) + "\n" + result.base64.slice(8),
      "base64",
    ),
    "Halo developer",
  );
});
