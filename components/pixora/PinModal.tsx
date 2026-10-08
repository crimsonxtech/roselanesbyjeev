"use client";

import { useEffect, useRef, useState } from "react";
import type { Gallery } from "./lib/types";
import { pinMatches } from "./lib/gallery";

// Small modal asking for the PIN before a gated action (favorite / download).
export default function PinModal({
    gallery,
    onFinish,
}: {
    gallery: Gallery;
    onFinish: (ok: boolean) => void;
}) {
    const [value, setValue] = useState("");
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => inputRef.current?.focus(), []);

    const submit = () => {
        if (pinMatches(value, gallery)) {
            onFinish(true);
        } else {
            setError("Wrong PIN");
            setValue("");
            inputRef.current?.focus();
        }
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onFinish(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onFinish]);

    return (
        <div
            className="pin-modal-overlay"
            onClick={(e) => e.target === e.currentTarget && onFinish(false)}
        >
            <div className="pin-modal-box">
                <button className="pin-modal-close" aria-label="Cancel" onClick={() => onFinish(false)}>
                    ✕
                </button>
                <h2>Enter PIN</h2>
                <p className="pin-modal-hint">This action requires the gallery PIN.</p>
                <input
                    ref={inputRef}
                    className="pin-modal-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={6}
                    placeholder="Enter PIN"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                />
                <button className="pin-modal-btn" onClick={submit}>
                    Continue
                </button>
                <p className="pin-modal-error">{error}</p>
            </div>
        </div>
    );
}
