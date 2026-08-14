function parseImageCandidateString(srcset) {
  if (!srcset.trim()) {
    return [];
  }
  return srcset.split(",").map((candidate) => {
    const parts = candidate.trim().split(/\s+/);
    const url = parts[0];
    if (!url) {
      return { url: "", descriptor: "none", raw: null };
    }
    if (parts.length < 2) {
      return { url, descriptor: "none", raw: null };
    }
    const descriptor = parts.at(-1);
    if (/^\d+w$/i.test(descriptor)) {
      return {
        url,
        descriptor: "width",
        value: Math.trunc(Number(descriptor.slice(0, -1))),
        raw: descriptor
      };
    }
    if (/^(?:\d*\.\d+|\d+(?:\.\d+)?)x$/i.test(descriptor)) {
      return {
        url,
        descriptor: "density",
        value: Number(descriptor.slice(0, -1)),
        raw: descriptor
      };
    }
    return { url, descriptor: "none", raw: descriptor };
  });
}

export { parseImageCandidateString as p };
//# sourceMappingURL=parse-image-candidate-string.js.map
