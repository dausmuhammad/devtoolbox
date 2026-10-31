import test from "node:test";
import assert from "node:assert/strict";
import {
  detectImageMime,
  imageBytesToBase64,
  MAX_IMAGE_BYTES,
  parseBase64Image,
  SAMPLE_IMAGE,
} from "../src/lib/image-base64.js";
test("Image Base64 round trip preserves every byte and MIME", () => {
  const parsed = parseBase64Image(SAMPLE_IMAGE);
  assert.equal(parsed.mime, "image/png");
  assert.equal(parsed.extension, "png");
  const encoded = imageBytesToBase64(parsed.bytes);
  assert.equal(encoded.dataUrl, SAMPLE_IMAGE);
  assert.deepEqual(parseBase64Image(encoded.base64).bytes, parsed.bytes);
});
test("Raw image Base64 accepts pasted line wrapping", () => {
  const raw = SAMPLE_IMAGE.split(",")[1];
  assert.equal(
    parseBase64Image(raw.slice(0, 30) + "\n " + raw.slice(30)).mime,
    "image/png",
  );
});
test("Image decoder rejects invalid input and mismatched MIME", () => {
  for (const value of [
    "",
    "%%%",
    "data:image/png;hello,abc",
    btoa("not an image"),
    SAMPLE_IMAGE.replace("image/png", "image/jpeg"),
  ])
    assert.throws(() => parseBase64Image(value));
});
test("Image encoder enforces size and empty file limits", () => {
  assert.throws(() => imageBytesToBase64(new Uint8Array()));
  assert.throws(
    () => imageBytesToBase64(new Uint8Array(MAX_IMAGE_BYTES + 1)),
    /10 MB/,
  );
  assert.throws(
    () =>
      parseBase64Image("A".repeat(Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 2049)),
    /10 MB/,
  );
});
test("Image signatures detect raster formats and reject arbitrary content", () => {
  assert.equal(
    detectImageMime(new Uint8Array([255, 216, 255, 224])),
    "image/jpeg",
  );
  assert.equal(
    detectImageMime(new TextEncoder().encode("GIF89a")),
    "image/gif",
  );
  assert.equal(
    detectImageMime(new TextEncoder().encode("RIFF0000WEBP")),
    "image/webp",
  );
  assert.equal(detectImageMime(new Uint8Array([0, 0, 1, 0])), "image/x-icon");
  assert.equal(
    detectImageMime(new TextEncoder().encode("0000ftypavif")),
    "image/avif",
  );
  assert.throws(() => detectImageMime(new TextEncoder().encode("<svg></svg>")));
});
