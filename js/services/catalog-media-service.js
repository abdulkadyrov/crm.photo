export const SERVICE_PRINT_ORIENTATIONS = Object.freeze(["auto", "vertical", "horizontal"]);

export function normalizeServicePrintOrientation(value) {
  const orientation = String(value || "").trim().toLowerCase();
  return SERVICE_PRINT_ORIENTATIONS.includes(orientation) ? orientation : "auto";
}

export function catalogVideoFormat({ type = "", name = "", src = "" } = {}) {
  const mime = String(type || "").trim().toLowerCase()
    || String(src || "").match(/^data:([^;,]+)/i)?.[1]?.toLowerCase()
    || "";
  const fileName = String(name || src || "").split(/[?#]/)[0].toLowerCase();
  const quickTime = mime === "video/quicktime" || /\.(mov|qt)$/.test(fileName);
  if (quickTime) return {
    playable: false,
    message: "MOV не воспроизводится на большинстве телефонов. Замените видео на MP4 (H.264)."
  };
  return { playable: true, message: "" };
}
