"use client";

/* eslint-disable @next/next/no-img-element */
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import PhotoActions from "./PhotoActions";
import type { Photo } from "./lib/types";

const ROW_GAP = 15;

// Row height used for the last, incomplete row so one leftover photo isn't
// stretched edge to edge.
const targetRowHeight = (vw: number) => (vw < 600 ? 180 : vw < 1000 ? 240 : 320);
const maxPerRow = (vw: number) => (vw < 768 ? 2 : vw < 1024 ? 3 : 4);

interface Item {
    photo: Photo;
    index: number;
    aspect: number;
}

interface Props {
    photos: Photo[];
    selectionMode: boolean;
    selected: Set<number>;
    onPhotoClick: (index: number) => void;
}

// Justified (Google-Photos-style) rows: every full row is stretched so the
// photos exactly fill the container width.
export default function JustifiedGrid({ photos, selectionMode, selected, onPhotoClick }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, viewport: 0 });

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;

        const measure = () =>
            setSize((prev) => {
                const next = { width: el.clientWidth, viewport: window.innerWidth };
                return prev.width === next.width && prev.viewport === next.viewport ? prev : next;
            });

        measure();

        let timer: number | undefined;
        const onResize = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(measure, 200);
        };
        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
            window.clearTimeout(timer);
        };
    }, []);

    const rows = useMemo(() => {
        if (!size.width) return [];

        const max = maxPerRow(size.viewport);
        const out: { items: Item[]; height: number; fill: boolean }[] = [];
        let row: Item[] = [];
        let aspectSum = 0;

        const flush = (fill: boolean) => {
            const gaps = (row.length - 1) * ROW_GAP;
            out.push({
                items: row,
                fill,
                height: fill ? (size.width - gaps) / aspectSum : targetRowHeight(size.viewport),
            });
            row = [];
            aspectSum = 0;
        };

        photos.forEach((photo, index) => {
            const aspect = (photo.width || 1600) / (photo.height || 1067);
            row.push({ photo, index, aspect });
            aspectSum += aspect;
            if (row.length >= max) flush(true);
        });

        if (row.length) flush(false);
        return out;
    }, [photos, size]);

    return (
        <div id="photoGrid" ref={ref} className={selectionMode ? "selecting" : ""}>
            {!photos.length && <h2>No Photos</h2>}

            {rows.map((row, r) => (
                <div className="row" key={r}>
                    {row.items.map(({ photo, index, aspect }) => {
                        const isSelected = selected.has(index);
                        return (
                            <div
                                key={index}
                                className={`photo ${isSelected ? "selected" : ""}`}
                                style={{
                                    width: `${row.height * aspect}px`,
                                    flex: row.fill ? undefined : "0 0 auto",
                                }}
                                onClick={() => onPhotoClick(index)}
                            >
                                <img
                                    loading="lazy"
                                    decoding="async"
                                    src={photo.thumb}
                                    alt=""
                                    style={{ width: "100%", height: `${row.height}px`, objectFit: "cover" }}
                                />
                                <PhotoActions photo={photo} />
                                <input
                                    type="checkbox"
                                    className="photo-select-box"
                                    checked={isSelected}
                                    readOnly
                                    tabIndex={-1}
                                />
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
