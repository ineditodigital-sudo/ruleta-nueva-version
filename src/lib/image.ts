/**
 * Las imágenes que se suben en el panel viajan dentro de la configuración
 * (data URL), así que se reducen antes de guardarlas: una foto de 5 MB haría
 * lenta cada sincronización de todos los tótems.
 */
export async function fileToDataUrl(file: File, maxSide = 800): Promise<string> {
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  // Los SVG se quedan como vienen: son ligeros y escalan sin perder calidad.
  if (file.type === "image/svg+xml") return original;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("No se pudo leer la imagen"));
    el.src = original;
  });
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return original;
  g.drawImage(img, 0, 0, w, h);
  const webp = canvas.toDataURL("image/webp", 0.88);
  // Safari antiguo no codifica WebP y devuelve PNG: igual sirve.
  return webp.length < original.length || scale < 1 ? webp : original;
}
