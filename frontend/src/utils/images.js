const OPTIMIZABLE_IMAGE_HOSTS = new Set(["images.unsplash.com"]);

function normalizeWidths(widths = []) {
  return [...new Set(widths.map((width) => Number(width)).filter((width) => width > 0))].sort(
    (left, right) => left - right,
  );
}

function canOptimizeImage(source) {
  try {
    const url = new URL(source);
    return OPTIMIZABLE_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function buildOptimizedImageUrl(source, width, quality) {
  const url = new URL(source);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("q", String(quality));
  url.searchParams.set("w", String(width));
  url.searchParams.delete("dpr");
  return url.toString();
}

export function getResponsiveImageProps(
  source,
  { widths = [], quality = 72, sizes } = {},
) {
  const normalizedWidths = normalizeWidths(widths);

  if (!source || normalizedWidths.length === 0 || !canOptimizeImage(source)) {
    return {
      src: source,
      srcSet: undefined,
      sizes,
    };
  }

  const largestWidth = normalizedWidths[normalizedWidths.length - 1];

  return {
    src: buildOptimizedImageUrl(source, largestWidth, quality),
    srcSet: normalizedWidths
      .map((width) => `${buildOptimizedImageUrl(source, width, quality)} ${width}w`)
      .join(", "),
    sizes,
  };
}

export function applyImageFallback(event, fallbackSrc) {
  const image = event.currentTarget;
  image.onerror = null;
  image.removeAttribute("srcset");
  image.removeAttribute("sizes");
  image.src = fallbackSrc;
}
