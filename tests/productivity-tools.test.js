import test from "node:test";
import assert from "node:assert/strict";
import {
  compareJson,
  generateDummy,
  toCsv,
  fitImage,
  wifiQr,
} from "../src/lib/productivity-tools.js";

test("JSON comparison ignores object order but preserves array order and value types", () => {
  assert.deepEqual(compareJson('{"a":1,"b":2}', '{"b":2,"a":1}'), []);
  assert.deepEqual(compareJson('{"x":[1,null]}', '{"x":["1",null,3]}'), [
    { path: "/x/0", type: "Diubah", before: 1, after: "1" },
    { path: "/x/2", type: "Ditambahkan", after: 3 },
  ]);
  assert.deepEqual(compareJson('{"a/b~":null}', "{}"), [
    { path: "/a~1b~0", type: "Dihapus", before: null },
  ]);
  assert.equal(compareJson("null", "[]")[0].path, "(root)");
  assert.throws(() => compareJson("{}", "bad"), /kanan/);
});
test("dummy data enforces bounds and exports properly escaped CSV", () => {
  for (const kind of ["users", "products", "transactions"]) {
    const rows = generateDummy(kind, 25);
    assert.equal(rows.length, 25);
    assert.equal(new Set(rows.map((r) => r.id)).size, 25);
    assert.equal(toCsv(rows).split("\r\n").length, 26);
  }
  assert.throws(() => generateDummy("users", 1001));
  assert.throws(() => generateDummy("users", null));
  assert.equal(toCsv([{ name: 'a,"b"\nc' }]), '"name"\r\n"a,""b""\nc"');
});
test("image bounds preserve ratio and never upscale", () => {
  assert.deepEqual(fitImage(4000, 2000, 1000, 1000), {
    width: 1000,
    height: 500,
  });
  assert.deepEqual(fitImage(200, 400, 1000, 1000), { width: 200, height: 400 });
  assert.deepEqual(fitImage(1, 40000, 1, 1), { width: 1, height: 1 });
  assert.throws(() => fitImage(100, 100, null, 100));
});
test("Wi-Fi QR escapes delimiters and omits open-network passwords", () => {
  assert.equal(
    wifiQr("Cafe;A", "a:b\\c", "WPA", true),
    "WIFI:T:WPA;S:Cafe\\;A;P:a\\:b\\\\c;H:true;;",
  );
  assert.equal(
    wifiQr("Open", "secret", "nopass", false),
    "WIFI:T:nopass;S:Open;P:;H:false;;",
  );
  assert.throws(() => wifiQr("", "", "WPA", false));
});
