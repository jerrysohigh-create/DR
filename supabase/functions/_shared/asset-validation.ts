export const assetRules: Record<
  string,
  {
    type: "image" | "video";
    ext: string;
    max: number;
    magic: (b: Uint8Array) => boolean;
  }
> = {
  "image/png": {
    type: "image",
    ext: "png",
    max: 5242880,
    magic: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  "image/jpeg": {
    type: "image",
    ext: "jpg",
    max: 5242880,
    magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  "image/webp": {
    type: "image",
    ext: "webp",
    max: 5242880,
    magic: (b) =>
      new TextDecoder().decode(b.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(b.slice(8, 12)) === "WEBP",
  },
  "video/mp4": {
    type: "video",
    ext: "mp4",
    max: 18874368,
    magic: (b) => new TextDecoder().decode(b.slice(4, 8)) === "ftyp",
  },
  "video/webm": {
    type: "video",
    ext: "webm",
    max: 18874368,
    magic: (b) =>
      b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  },
};
export function validateAsset(mime: string, size: number, head: Uint8Array) {
  const rule = assetRules[mime];
  if (!rule) return { error: "Unsupported file type" };
  if (!Number.isInteger(size) || size < 1 || size > rule.max)
    return {
      error:
        rule.type === "image" ? "Image exceeds 5 MB" : "Video exceeds 18 MB",
    };
  if (!rule.magic(head))
    return { error: "File signature does not match MIME type" };
  return { rule };
}
