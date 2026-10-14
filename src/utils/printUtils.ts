/**
 * Bulletproof printing utility for local PC printing.
 * Works seamlessly both in standalone browser tabs and inside embedded iframes.
 */

export function printReportDocument(elementId: string, documentTitle: string = 'Paradise Fisheries - Daily Stock Report') {
  const sourceElement = document.getElementById(elementId);

  if (!sourceElement) {
    console.warn(`Element #${elementId} not found, falling back to window.print()`);
    window.print();
    return;
  }

  // Gather all active stylesheets and CSS rules
  let stylesHtml = '';
  const stylesheets = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
  stylesheets.forEach((sheet) => {
    stylesHtml += sheet.outerHTML;
  });

  const contentHtml = sourceElement.outerHTML;

  const customPrintStyles = `
    <style>
      @page {
        size: A4 portrait;
        margin: 10mm 12mm;
      }
      @media print {
        *, *:before, *:after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        body {
          background-color: #ffffff !important;
          color: #111827 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 11pt !important;
        }
        .no-print, button, nav, aside {
          display: none !important;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          page-break-inside: auto !important;
        }
        tr {
          page-break-inside: avoid !important;
          page-break-after: auto !important;
        }
        thead {
          display: table-header-group !important;
        }
        tfoot {
          display: table-footer-group !important;
        }
        h1, h2, h3, h4 {
          page-break-after: avoid !important;
        }
      }
      body {
        margin: 0;
        padding: 16px;
        background: #ffffff;
        color: #111827;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
    </style>
  `;

  // Try iframe-based printing first (prevents printing the entire surrounding dashboard)
  let printIframe = document.getElementById('app-print-service-iframe') as HTMLIFrameElement | null;
  if (printIframe && printIframe.parentNode) {
    printIframe.parentNode.removeChild(printIframe);
  }

  printIframe = document.createElement('iframe');
  printIframe.id = 'app-print-service-iframe';
  printIframe.setAttribute('style', 'position:fixed;top:0;left:0;width:1px;height:1px;border:none;opacity:0;pointer-events:none;z-index:-9999;');
  document.body.appendChild(printIframe);

  try {
    const frameDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>${documentTitle}</title>
            ${stylesHtml}
            ${customPrintStyles}
          </head>
          <body>
            ${contentHtml}
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          if (printIframe && printIframe.contentWindow) {
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();
          } else {
            window.print();
          }
        } catch (printErr) {
          console.warn('Iframe print call failed, invoking direct print:', printErr);
          window.print();
        }
      }, 350);
      return;
    }
  } catch (err) {
    console.warn('Could not initialize print iframe, falling back to window.print():', err);
  }

  // Fallback to window.print()
  window.print();
}
