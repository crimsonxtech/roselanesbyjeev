// Route params can arrive percent-encoded ("Riya%20%26%20Sam").
export function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}
