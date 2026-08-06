/** Renders a fragment of print-ready HTML (as produced by the tenant-data
 *  document generators) into an actual PDF file, off-screen, using the same
 *  html2canvas + jsPDF page-slicing recipe the ecosystem generally uses for
 *  "screenshot this DOM node into a multi-page PDF". Runs client-side only. */
export async function htmlToPdfBlob(bodyHtml: string): Promise<Blob> {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
    ]);

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '700px';
    container.style.background = '#ffffff';
    container.style.padding = '48px';
    container.style.fontFamily = 'Arial, Helvetica, sans-serif';
    container.style.color = '#111';
    container.style.lineHeight = '1.6';
    container.innerHTML = bodyHtml;
    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        return pdf.output('blob');
    } finally {
        document.body.removeChild(container);
    }
}
