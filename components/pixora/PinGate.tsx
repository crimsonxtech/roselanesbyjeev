"use client";

import { useState } from "react";
import type { Gallery } from "./lib/types";
import { pinMatches } from "./lib/gallery";

// Full-page gate shown when gallery.passwordProtected is true and the
// visitor hasn't entered the PIN yet.
export default function PinGate({ gallery, onUnlock }: { gallery: Gallery; onUnlock: () => void }) {
    const [value, setValue] = useState("");
    const [error, setError] = useState("");

    const submit = () => {
        if (pinMatches(value, gallery)) onUnlock();
        else setError("Wrong PIN");
    };

    return (
        <div id="pinOverlay">
            <div className="pinBox">
                <h2>Private Gallery</h2>

                <input
                    id="pinInput"
                    maxLength={4}
                    placeholder="Enter PIN"
                    inputMode="numeric"
                    autoComplete="off"
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                />

                <button id="pinBtn" onClick={submit}>
                    Continue
                </button>

                <p id="pinError">{error}</p>
            </div>
        </div>
    );
}
