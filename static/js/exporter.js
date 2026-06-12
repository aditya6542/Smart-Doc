// Exporter Module for PDF, DOCX, HTML, MD, and Plain Text

// Trigger browser download for any blob
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportToPDFCanvas(title, pageElements, styles) {
  const { jsPDF } = window.jspdf;
  styles = styles || {};
  
  const isLandscape = styles.orientation === 'landscape';
  const format = styles.pageSize ? styles.pageSize.toLowerCase() : 'a4';
  
  let pdfWidth = 595.28;
  let pdfHeight = 841.89;
  
  if (format === 'letter') {
    pdfWidth = 612;
    pdfHeight = 792;
  } else if (format === 'legal') {
    pdfWidth = 612;
    pdfHeight = 1008;
  }
  
  if (isLandscape) {
    const temp = pdfWidth;
    pdfWidth = pdfHeight;
    pdfHeight = temp;
  }
  
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: format
  });
  
  const originalTitle = document.title;
  document.title = "Generating PDF...";
  
  const pageEl = pageElements[0]; // Capture the full continuous #editorPage element
  
  const pageSize = styles.pageSize ? styles.pageSize.toLowerCase() : 'a4';
  let pageLimitHeight = 1123;
  if (pageSize === 'letter') {
    pageLimitHeight = isLandscape ? 816 : 1056;
  } else if (pageSize === 'legal') {
    pageLimitHeight = isLandscape ? 816 : 1344;
  } else {
    pageLimitHeight = isLandscape ? 794 : 1123;
  }
  
  // Create offscreen wrapper to build paginated elements
  const tempWrapper = document.createElement('div');
  tempWrapper.className = 'document-canvas';
  tempWrapper.style.position = 'absolute';
  tempWrapper.style.left = '-9999px';
  tempWrapper.style.top = '-9999px';
  tempWrapper.style.width = pageEl.offsetWidth + 'px';
  document.body.appendChild(tempWrapper);
  
  const pagesList = [];
  
  function createTempPage() {
    const p = document.createElement('div');
    p.className = pageEl.className; // copy styling/theme classes
    p.style.cssText = pageEl.style.cssText; // copy styles
    p.style.height = 'auto'; // allow it to grow for layout height measurement
    p.style.minHeight = '0px';
    p.style.boxShadow = 'none';
    p.style.border = 'none';
    p.style.transform = 'none';
    p.style.transition = 'none';
    
    // Create ProseMirror inner container
    const pm = document.createElement('div');
    pm.className = 'ProseMirror';
    p.appendChild(pm);
    
    tempWrapper.appendChild(p);
    return { page: p, content: pm };
  }
  
  let currentTemp = createTempPage();
  pagesList.push(currentTemp);
  
  // Apply page decorations (headers, footers, watermarks, numbering)
  function applyBrandingToPage(pEl, idx, total) {
    const isCoverPage = pEl.querySelector('.cover-page-container') !== null;
    if (isCoverPage) return; // Cover page doesn't get headers/footers/watermarks
    
    // 1. Watermark
    if (styles.watermarkText) {
      const watermarkEl = document.createElement('div');
      watermarkEl.className = 'watermark-overlay';
      watermarkEl.textContent = styles.watermarkText;
      watermarkEl.style.setProperty('--wm-opacity', styles.watermarkOpacity || 0.08);
      watermarkEl.style.setProperty('--wm-angle', `${styles.watermarkAngle || -45}deg`);
      const size = styles.watermarkText.length > 12 ? '42px' : '64px';
      watermarkEl.style.setProperty('--wm-size', size);
      pEl.appendChild(watermarkEl);
    }
    
    // 2. Header
    if (styles.headerText) {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'page-header';
      headerDiv.style.left = styles.margins?.left || '1in';
      headerDiv.style.right = styles.margins?.right || '1in';
      headerDiv.innerHTML = `<span>${styles.headerText}</span><span></span>`;
      pEl.appendChild(headerDiv);
    }
    
    // 3. Footer
    if (styles.footerText || styles.pageNumbers) {
      const footerDiv = document.createElement('div');
      footerDiv.className = 'page-footer';
      footerDiv.style.left = styles.margins?.left || '1in';
      footerDiv.style.right = styles.margins?.right || '1in';
      footerDiv.innerHTML = `<span>${styles.footerText || ''}</span><span>${styles.pageNumbers ? `Page ${idx + 1} of ${total}` : ''}</span>`;
      pEl.appendChild(footerDiv);
    }
  }
  
  const editorContent = pageEl.querySelector('.ProseMirror');
  if (!editorContent) {
    if (tempWrapper) tempWrapper.remove();
    document.title = originalTitle;
    alert('Failed to read document content.');
    return;
  }
  
  const originalNodes = Array.from(editorContent.childNodes);
  
  // Custom distributor
  function appendNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim()) {
        const clone = node.cloneNode(true);
        currentTemp.content.appendChild(clone);
      }
      return;
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.classList.contains('page-break-line')) return;
    
    if (node.tagName === 'TABLE') {
      let tableClone = node.cloneNode(false);
      currentTemp.content.appendChild(tableClone);
      
      const rows = Array.from(node.querySelectorAll('tr'));
      let headerRow = null;
      if (rows.length > 0 && rows[0].querySelector('th')) {
        headerRow = rows[0].cloneNode(true);
      }
      
      let tbody = tableClone.querySelector('tbody');
      if (!tbody) {
        tbody = document.createElement('tbody');
        tableClone.appendChild(tbody);
      }
      
      rows.forEach((row, rIdx) => {
        const rowClone = row.cloneNode(true);
        tbody.appendChild(rowClone);
        
        // Measure height
        if (currentTemp.page.offsetHeight > pageLimitHeight) {
          if (currentTemp.content.childNodes.length === 1 && tbody.childNodes.length === 1) {
            // Keep first row if table is first child on blank page
          } else {
            rowClone.remove();
            
            // Start a new page
            currentTemp = createTempPage();
            pagesList.push(currentTemp);
            
            // New table
            tableClone = node.cloneNode(false);
            currentTemp.content.appendChild(tableClone);
            
            tbody = document.createElement('tbody');
            tableClone.appendChild(tbody);
            
            if (headerRow && rIdx > 0) {
              tbody.appendChild(headerRow.cloneNode(true));
            }
            
            tbody.appendChild(rowClone);
          }
        }
      });
    } else if (node.tagName === 'UL' || node.tagName === 'OL') {
      let listClone = node.cloneNode(false);
      currentTemp.content.appendChild(listClone);
      
      const items = Array.from(node.querySelectorAll('li'));
      items.forEach((item) => {
        const itemClone = item.cloneNode(true);
        listClone.appendChild(itemClone);
        
        // Measure height
        if (currentTemp.page.offsetHeight > pageLimitHeight) {
          if (currentTemp.content.childNodes.length === 1 && listClone.childNodes.length === 1) {
            // Keep first item if list is first child on blank page
          } else {
            itemClone.remove();
            
            // Start new page
            currentTemp = createTempPage();
            pagesList.push(currentTemp);
            
            listClone = node.cloneNode(false);
            currentTemp.content.appendChild(listClone);
            listClone.appendChild(itemClone);
          }
        }
      });
    } else {
      // General elements (headings, p, blockquote, pre)
      const clone = node.cloneNode(true);
      currentTemp.content.appendChild(clone);
      
      if (currentTemp.page.offsetHeight > pageLimitHeight) {
        if (currentTemp.content.childNodes.length > 1) {
          clone.remove();
          
          currentTemp = createTempPage();
          pagesList.push(currentTemp);
          currentTemp.content.appendChild(clone);
        }
      }
    }
  }
  
  try {
    originalNodes.forEach(appendNode);
    
    const totalPages = pagesList.length;
    
    // Apply heights and branding
    pagesList.forEach((item, idx) => {
      item.page.style.height = pageLimitHeight + 'px';
      applyBrandingToPage(item.page, idx, totalPages);
      // Force repaint / layout
      item.page.offsetHeight;
    });
    
    // Capture and construct pages
    for (let idx = 0; idx < totalPages; idx++) {
      const item = pagesList[idx];
      
      if (idx > 0) doc.addPage();
      
      const canvas = await html2canvas(item.page, {
        scale: 2, // High DPI capture
        useCORS: true,
        logging: false,
        width: item.page.offsetWidth,
        height: item.page.offsetHeight,
        windowWidth: item.page.offsetWidth,
        windowHeight: item.page.offsetHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }
    
    doc.save(`${title.replace(/[^\w]/g, '_')}.pdf`);
  } catch (err) {
    console.error('PDF Canvas generation error', err);
    alert('Failed to generate PDF canvas snapshot. Falling back to native text export.');
    exportToPDFText(title, pageElements, styles);
  } finally {
    document.title = originalTitle;
    if (tempWrapper) {
      tempWrapper.remove();
    }
  }
}

// 2. Export as Text-based Vector PDF (Selectable text)
export function exportToPDFText(title, pageElements, styles) {
  const { jsPDF } = window.jspdf;
  const isLandscape = styles.orientation === 'landscape';
  const format = styles.pageSize ? styles.pageSize.toLowerCase() : 'a4';
  
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'in',
    format: format
  });
  
  // Extract text and place on page manually
  let y = 1.0;
  const margin = 1.0;
  
  pageElements.forEach((pageEl, idx) => {
    if (idx > 0) doc.addPage();
    
    // Header
    if (styles.headerText) {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(styles.headerText, margin, 0.5);
    }
    
    // Process child text elements
    // This is a basic vector placement backup
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = pageEl.innerHTML;
    
    // Strip watermarks and page breaks
    const watermarks = tempDiv.querySelectorAll('.watermark-overlay, .page-header, .page-footer');
    watermarks.forEach(el => el.remove());
    
    const lines = doc.splitTextToSize(tempDiv.textContent || tempDiv.innerText, 6.5);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(lines, margin, y);
    
    // Footer
    if (styles.footerText) {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(styles.footerText, margin, doc.internal.pageSize.getHeight() - 0.5);
    }
    if (styles.pageNumbers) {
      doc.text(`Page ${idx + 1}`, doc.internal.pageSize.getWidth() - margin - 0.5, doc.internal.pageSize.getHeight() - 0.5);
    }
  });
  
  doc.save(`${title.replace(/[^\w]/g, '_')}_text.pdf`);
}

// 3. Export as DOCX using docx.js (standard word format)
export async function exportToDOCX(title, editorHTML, styles) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle } = window.docx;
  
  const temp = document.createElement('div');
  temp.innerHTML = editorHTML;
  
  // Clean comments and suggestions
  temp.querySelectorAll('.watermark-overlay, .page-header, .page-footer').forEach(el => el.remove());
  
  const children = Array.from(temp.childNodes);
  const docSections = [];
  
  children.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim()) {
        docSections.push(new Paragraph({
          children: [new TextRun(node.textContent)]
        }));
      }
      return;
    }
    
    const tag = node.tagName.toLowerCase();
    const text = node.textContent.trim();
    
    if (tag.startsWith('h')) {
      const lvlNum = parseInt(tag.substring(1));
      let docHeadingLvl = HeadingLevel.HEADING_1;
      if (lvlNum === 2) docHeadingLvl = HeadingLevel.HEADING_2;
      if (lvlNum >= 3) docHeadingLvl = HeadingLevel.HEADING_3;
      
      docSections.push(new Paragraph({
        text: text,
        heading: docHeadingLvl,
        spacing: { before: 200, after: 100 }
      }));
    } 
    else if (tag === 'p') {
      docSections.push(new Paragraph({
        children: [new TextRun({
          text: text,
          bold: node.querySelector('strong') !== null,
          italics: node.querySelector('em') !== null
        })],
        spacing: { after: 120 }
      }));
    }
    else if (tag === 'blockquote') {
      docSections.push(new Paragraph({
        children: [new TextRun({
          text: text,
          italics: true
        })],
        spacing: { before: 100, after: 100 }
      }));
    }
    else if (tag === 'ul' || tag === 'ol') {
      const lis = node.querySelectorAll('li');
      lis.forEach(li => {
        docSections.push(new Paragraph({
          text: li.textContent.trim(),
          bullet: tag === 'ul' ? { level: 0 } : undefined
        }));
      });
    }
    else if (tag === 'table') {
      const rows = [];
      const trs = node.querySelectorAll('tr');
      
      trs.forEach(tr => {
        const cells = [];
        const tds = tr.querySelectorAll('th, td');
        
        tds.forEach(td => {
          cells.push(new TableCell({
            children: [new Paragraph(td.textContent.trim())],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" }
            }
          }));
        });
        
        rows.push(new TableRow({ children: cells }));
      });
      
      docSections.push(new Table({ rows: rows }));
    }
    else if (tag === 'hr') {
      docSections.push(new Paragraph({
        text: "__________________________________________________",
        spacing: { before: 200, after: 200 }
      }));
    }
  });

  // Create word document object
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch in dxa
            bottom: 1440,
            left: 1440,
            right: 1440
          },
          size: {
            orientation: styles.orientation === 'landscape' ? 'landscape' : 'portrait'
          }
        }
      },
      children: docSections
    }]
  });

  Packer.toBlob(doc).then(blob => {
    triggerDownload(blob, `${title.replace(/[^\w]/g, '_')}.docx`);
  }).catch(err => {
    console.error('Word export error', err);
    alert('Word DOCX file generation failed.');
  });
}

// 4. Export as HTML document
export function exportToHTML(title, editorHTML, styles) {
  const pageFont = styles.fontFamily === 'Lora' || styles.fontFamily === 'Playfair Display' ? 'Georgia, serif' : 'system-ui, sans-serif';
  const customHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: ${pageFont};
          line-height: ${styles.lineSpacing || '1.5'};
          color: #0f172a;
          max-width: 800px;
          margin: 2in auto;
          padding: 0 20px;
        }
        h1 { font-size: 2.25em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
        h2 { font-size: 1.75em; margin-top: 1.5em; }
        h3 { font-size: 1.35em; }
        blockquote { border-left: 4px solid ${styles.themeColor || '#3b82f6'}; padding-left: 16px; font-style: italic; color: #475569; }
        pre { background-color: #1e293b; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
        th { background-color: #f1f5f9; }
        img { max-width: 100%; border-radius: 4px; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 72px; opacity: 0.05; color: black; font-weight: bold; pointer-events: none; }
      </style>
    </head>
    <body>
      ${styles.watermarkText ? `<div class="watermark">${styles.watermarkText}</div>` : ''}
      ${editorHTML}
    </body>
    </html>
  `;
  
  const blob = new Blob([customHtml], { type: 'text/html;charset=utf-8' });
  triggerDownload(blob, `${title.replace(/[^\w]/g, '_')}.html`);
}

// 5. Export as Markdown
export function exportToMarkdown(title, editorHTML) {
  const temp = document.createElement('div');
  temp.innerHTML = editorHTML;
  
  let md = '';
  
  const nodes = Array.from(temp.childNodes);
  nodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim()) md += node.textContent + '\n\n';
      return;
    }
    
    const tag = node.tagName.toLowerCase();
    const text = node.textContent.trim();
    
    if (tag === 'h1') md += `# ${text}\n\n`;
    else if (tag === 'h2') md += `## ${text}\n\n`;
    else if (tag === 'h3') md += `### ${text}\n\n`;
    else if (tag === 'h4') md += `#### ${text}\n\n`;
    else if (tag === 'p') {
      // Inline styling conversions
      let pText = node.innerHTML
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<em>(.*?)<\/em>/g, '*$1*')
        .replace(/<code>(.*?)<\/code>/g, '`$1`')
        .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');
      // Strip tags
      const div = document.createElement('div');
      div.innerHTML = pText;
      md += (div.textContent || div.innerText) + '\n\n';
    }
    else if (tag === 'blockquote') md += `> ${text}\n\n`;
    else if (tag === 'ul') {
      node.querySelectorAll('li').forEach(li => {
        md += `- ${li.textContent.trim()}\n`;
      });
      md += '\n';
    }
    else if (tag === 'ol') {
      node.querySelectorAll('li').forEach((li, idx) => {
        md += `${idx + 1}. ${li.textContent.trim()}\n`;
      });
      md += '\n';
    }
    else if (tag === 'pre') {
      md += `\`\`\`\n${text}\n\`\`\`\n\n`;
    }
    else if (tag === 'table') {
      const trs = node.querySelectorAll('tr');
      trs.forEach((tr, trIdx) => {
        const cells = Array.from(tr.querySelectorAll('th, td')).map(td => td.textContent.trim());
        md += `| ${cells.join(' | ')} |\n`;
        
        if (trIdx === 0) {
          // divider row
          const divider = cells.map(() => '---');
          md += `| ${divider.join(' | ')} |\n`;
        }
      });
      md += '\n';
    }
    else if (tag === 'hr') md += '---\n\n';
  });
  
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, `${title.replace(/[^\w]/g, '_')}.md`);
}

// 6. Export as Plain Text (.txt)
export function exportToTXT(title, editorHTML) {
  const temp = document.createElement('div');
  temp.innerHTML = editorHTML;
  
  // Clean watermarks
  temp.querySelectorAll('.watermark-overlay, .page-header, .page-footer').forEach(el => el.remove());
  
  const plainText = temp.textContent || temp.innerText || '';
  const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, `${title.replace(/[^\w]/g, '_')}.txt`);
}
