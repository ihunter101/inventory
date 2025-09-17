export function genPONumber() {
  const d = new Date();
  return `PO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    Math.floor(Math.random() * 900) + 100
  )}`;
}

// PO- 2025-07-001