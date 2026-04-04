import { useEffect, useState } from "react";

const DEFAULT_LAYOUT = {
  shape: "landscape",
  aspectRatio: 16 / 9,
  popupMode: "split",
};

function clampAspectRatio(ratio) {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return DEFAULT_LAYOUT.aspectRatio;
  }

  return Math.min(2.6, Math.max(0.72, ratio));
}

function getArtworkShape(ratio) {
  if (ratio >= 1.95) {
    return "ultra-wide";
  }

  if (ratio >= 1.15) {
    return "landscape";
  }

  if (ratio <= 0.85) {
    return "portrait";
  }

  return "square";
}

export default function useFestiveArtworkLayout(imageUrl) {
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);

  useEffect(() => {
    if (!imageUrl) {
      setLayout(DEFAULT_LAYOUT);
      return undefined;
    }

    let active = true;
    const image = new window.Image();
    image.decoding = "async";

    image.onload = () => {
      if (!active) {
        return;
      }

      const width = Math.max(1, image.naturalWidth || 1);
      const height = Math.max(1, image.naturalHeight || 1);
      const rawAspectRatio = width / height;
      const shape = getArtworkShape(rawAspectRatio);

      setLayout({
        shape,
        aspectRatio: clampAspectRatio(rawAspectRatio),
        popupMode: shape === "ultra-wide" ? "stacked" : "split",
      });
    };

    image.onerror = () => {
      if (active) {
        setLayout(DEFAULT_LAYOUT);
      }
    };

    image.src = imageUrl;

    return () => {
      active = false;
    };
  }, [imageUrl]);

  return layout;
}
