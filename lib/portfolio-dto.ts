import { mediaUrl } from "@/lib/media";

export type PortfolioDTO = {
  id: string;
  alt: string;
  width: number;
  height: number;
  thumbUrl: string;
  displayUrl: string;
  downloadUrl: string;
};

export const galleryPath = (assetId: string, file: string) =>
  `portfolio/gallery/${assetId}/${file}`;

export function toPortfolioDTO(row: {
  id: string;
  assetId: string;
  alt: string;
  width: number;
  height: number;
}): PortfolioDTO {
  return {
    id: row.id,
    alt: row.alt,
    width: row.width,
    height: row.height,
    thumbUrl: mediaUrl(galleryPath(row.assetId, "thumb.webp")),
    displayUrl: mediaUrl(galleryPath(row.assetId, "display.webp")),
    // Same-origin route that streams the original as a file download
    downloadUrl: `/api/portfolio/${row.id}/download`,
  };
}