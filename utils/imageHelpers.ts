import QRCode from "qrcode";

export type CompressedImageResult = {
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
};

/**
 * Skaliert große Smartphone-Fotos clientseitig herunter und komprimiert sie,
 * damit sowohl KI-Uploads (< 4,5 MB Vercel-Limit) als auch localStorage & Supabase
 * zuverlässig und schnell bleiben.
 */
export function compressImageFile(
  file: File,
  opts?: { maxDim?: number; quality?: number; preservePng?: boolean }
): Promise<CompressedImageResult> {
  const maxDim = opts?.maxDim ?? 1600;
  const quality = opts?.quality ?? 0.82;
  const preservePng = opts?.preservePng ?? false;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Bilddatei konnte nicht gelesen werden."));
    reader.onload = () => {
      const rawDataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!rawDataUrl) {
        reject(new Error("Leere Bilddatei."));
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        const naturalW = img.naturalWidth || img.width || 800;
        const naturalH = img.naturalHeight || img.height || 600;
        const scale = Math.min(1, maxDim / Math.max(naturalW, naturalH));
        const targetW = Math.max(1, Math.round(naturalW * scale));
        const targetH = Math.max(1, Math.round(naturalH * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({
            dataUrl: rawDataUrl,
            mimeType: file.type || "image/jpeg",
            width: naturalW,
            height: naturalH,
          });
          return;
        }

        const keepPng =
          preservePng &&
          file.type === "image/png" &&
          file.size <= 1.2 * 1024 * 1024 &&
          scale === 1;

        if (!keepPng) {
          // Weißer Hintergrund, damit transparente PNGs/WebPs beim JPEG-Export nicht schwarz werden
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, targetW, targetH);
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const outMime = keepPng ? "image/png" : "image/jpeg";
        const outDataUrl = keepPng
          ? canvas.toDataURL("image/png")
          : canvas.toDataURL("image/jpeg", quality);

        resolve({
          dataUrl: outDataUrl,
          mimeType: outMime,
          width: targetW,
          height: targetH,
        });
      };

      img.onerror = () => {
        resolve({
          dataUrl: rawDataUrl,
          mimeType: file.type || "image/jpeg",
          width: 800,
          height: 520,
        });
      };

      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Ermittelt echte Bildproportionen für den Word-Export (.docx) und wandelt
 * nicht von docx unterstützte Formate (z. B. WebP) automatisch in PNG um.
 */
export function prepareDataUrlForDocx(
  dataUrl: string,
  targetWidthPx: number
): Promise<{
  bytes: Uint8Array;
  imgType: "png" | "jpg" | "gif";
  width: number;
  height: number;
} | null> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      resolve(null);
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      try {
        const natW = img.naturalWidth || img.width || targetWidthPx;
        const natH = img.naturalHeight || img.height || Math.round(targetWidthPx * 0.65);
        const aspect = natH / Math.max(1, natW);
        const width = targetWidthPx;
        // Max-Höhe begrenzen, damit sehr hohe Hochformat-Bilder nicht aus der Word-Seite laufen
        const rawHeight = Math.round(width * aspect);
        const maxHeight = 520;
        const finalWidth = rawHeight > maxHeight ? Math.max(80, Math.round(maxHeight / aspect)) : width;
        const finalHeight = rawHeight > maxHeight ? maxHeight : Math.max(40, rawHeight);

        const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/i);
        if (match) {
          const rawType = match[1].toLowerCase();
          const imgType: "png" | "jpg" | "gif" =
            rawType === "jpeg" || rawType === "jpg"
              ? "jpg"
              : rawType === "gif"
              ? "gif"
              : "png";
          resolve({
            bytes: base64ToBytes(match[2]),
            imgType,
            width: finalWidth,
            height: finalHeight,
          });
          return;
        }

        // z. B. WebP oder SVG -> über Canvas in PNG umwandeln
        const canvas = document.createElement("canvas");
        canvas.width = natW;
        canvas.height = natH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, natW, natH);
        ctx.drawImage(img, 0, 0, natW, natH);
        const pngUrl = canvas.toDataURL("image/png");
        const pngB64 = pngUrl.split(",")[1];
        resolve({
          bytes: base64ToBytes(pngB64),
          imgType: "png",
          width: finalWidth,
          height: finalHeight,
        });
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      try {
        const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/i);
        if (!match) {
          resolve(null);
          return;
        }
        const rawType = match[1].toLowerCase();
        const imgType: "png" | "jpg" | "gif" =
          rawType === "jpeg" || rawType === "jpg"
            ? "jpg"
            : rawType === "gif"
            ? "gif"
            : "png";
        resolve({
          bytes: base64ToBytes(match[2]),
          imgType,
          width: targetWidthPx,
          height: Math.round(targetWidthPx * 0.65),
        });
      } catch {
        resolve(null);
      }
    };

    img.src = dataUrl;
  });
}

/**
 * Erzeugt ein echtes QR-Code-PNG für den Word-Export (.docx).
 */
export async function generateQrCodePngBytes(
  url: string,
  sizePx = 180
): Promise<Uint8Array | null> {
  try {
    const cleanUrl = (url || "https://lehrreich-studio.de").trim();
    const pngDataUrl = await QRCode.toDataURL(cleanUrl, {
      width: sizePx,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    const b64 = pngDataUrl.split(",")[1];
    if (!b64) return null;
    return base64ToBytes(b64);
  } catch {
    return null;
  }
}
