"use client";

import html2canvas from "html2canvas";
import { chartStyle } from "@/lib/theme";

/**
 * Capture an element as PNG and trigger download.
 */
export async function exportElementAsPng(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const name = filename.endsWith(".png") ? filename : `${filename}.png`;
  const canvas = await html2canvas(element, {
    useCORS: true,
    scale: 2,
    backgroundColor: chartStyle.tooltipBg,
    logging: false,
  });
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}
