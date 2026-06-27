/**
 * downloadNode — client-side "download as PDF".
 *
 * For the mock phase this opens a clean print window containing just the given
 * element's HTML and triggers the browser's print dialog (where the user picks
 * "Save as PDF"). It proves the document layout end-to-end without a backend.
 *
 * In production these documents (report cards, invoices, receipts, broadsheets)
 * are generated server-side with Browsershot so they're pixel-identical and can
 * be emailed/stored — at which point this is replaced by a download link.
 */
export function downloadNode(node, title = "Sembly Document") {
  if (!node) return;
  const win = window.open("", "_blank", "width=800,height=1000");
  if (!win) return;
  // pull the app's stylesheets so the print window looks like the app
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((s) => s.outerHTML)
    .join("\n");
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>${styles}
    <style>body{margin:0;background:#fff;font-family:system-ui,sans-serif} @page{margin:14mm}</style>
    </head><body>${node.outerHTML}</body></html>`);
  win.document.close();
  win.focus();
  // give styles a tick to apply, then print
  setTimeout(() => { win.print(); }, 350);
}

/** Convenience for simple text/data "downloads" we only mock for now. */
export function mockDownload(label, onToast) {
  if (onToast) onToast(`${label} downloaded (PDF)`);
}
