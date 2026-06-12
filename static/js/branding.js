// Visual Branding, Cover Pages, and Signatures module

export function updateWatermark(pageEl, text, opacity, angle) {
  let watermarkEl = pageEl.querySelector('.watermark-overlay');
  
  if (!text.trim()) {
    if (watermarkEl) watermarkEl.remove();
    return;
  }
  
  if (!watermarkEl) {
    watermarkEl = document.createElement('div');
    watermarkEl.className = 'watermark-overlay';
    pageEl.appendChild(watermarkEl);
  }
  
  watermarkEl.textContent = text;
  watermarkEl.style.setProperty('--wm-opacity', opacity);
  watermarkEl.style.setProperty('--wm-angle', `${angle}deg`);
  
  // Dynamic font scaling depending on length
  const size = text.length > 12 ? '42px' : '64px';
  watermarkEl.style.setProperty('--wm-size', size);
}

// Injects beautiful pre-styled cover pages into editor
export function getCoverPageHTML(style, details) {
  const title = details.title || 'DOCUMENT TITLE';
  const subtitle = details.subtitle || 'Sub-heading details and document description';
  const author = details.author || 'Author Name';
  const org = details.organization || 'Organization Name';
  const date = details.date || new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  
  if (style === 'minimal') {
    return `
      <div class="cover-page-container minimal-cover-style" style="height: 1000px; display: flex; flex-direction: column; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 40px; margin-bottom: 60px; page-break-after: always; contenteditable: false;">
        <div style="margin-top: 150px; text-align: left;">
          <h1 style="font-size: 44px; font-weight: 800; color: #0f172a; line-height: 1.1; margin-bottom: 20px;">${title}</h1>
          <p style="font-size: 18px; color: #475569; font-weight: 400;">${subtitle}</p>
          <div style="width: 80px; height: 4px; bg-color: #3b82f6; background-color: #3b82f6; margin-top: 30px;"></div>
        </div>
        <div style="margin-bottom: 100px; font-size: 13px; color: #64748b; line-height: 1.6;">
          <p><strong>Prepared by:</strong> ${author}</p>
          <p><strong>Organization:</strong> ${org}</p>
          <p><strong>Date:</strong> ${date}</p>
        </div>
      </div>
    `;
  }
  
  if (style === 'corporate') {
    return `
      <div class="cover-page-container corporate-cover-style" style="height: 1000px; display: flex; flex-direction: column; justify-content: space-between; border-bottom: 2px solid #e2e8f0; margin-bottom: 60px; page-break-after: always;" contenteditable="false">
        <div style="background-color: #1e3a8a; color: #ffffff; padding: 60px 40px; margin-left: -1in; margin-right: -1in; margin-top: -1in;">
          <span style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #93c5fd;">BUSINESS PORTFOLIO</span>
          <h1 style="font-size: 38px; font-weight: 700; color: #ffffff; line-height: 1.2; margin-top: 15px; margin-bottom: 15px;">${title}</h1>
          <p style="font-size: 15px; color: #bfdbfe; font-weight: 300;">${subtitle}</p>
        </div>
        <div style="padding: 40px; margin-bottom: 100px; font-size: 13px; color: #334155;">
          <table style="border: none; width: 100%; border-collapse: collapse;">
            <tbody>
              <tr>
                <td style="border: none; padding: 4px 0; width: 120px; font-weight: bold; color: #64748b;">PREPARED FOR:</td>
                <td style="border: none; padding: 4px 0; font-weight: bold;">${org}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 4px 0; color: #64748b;">AUTHOR:</td>
                <td style="border: none; padding: 4px 0;">${author}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 4px 0; color: #64748b;">DATE:</td>
                <td style="border: none; padding: 4px 0;">${date}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
  
  if (style === 'academic') {
    return `
      <div class="cover-page-container academic-cover-style" style="height: 1000px; display: flex; flex-direction: column; justify-content: space-between; text-align: center; border-bottom: 2px dashed #94a3b8; padding-bottom: 40px; margin-bottom: 60px; page-break-after: always;" contenteditable="false">
        <div style="margin-top: 50px;">
          <h3 style="font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #475569;">${org}</h3>
          <p style="font-size: 11px; color: #64748b;">DEPARTMENT OF GRADUATE STUDIES</p>
        </div>
        <div style="margin-top: 100px; margin-bottom: 100px; padding: 0 20px;">
          <h1 style="font-size: 34px; font-weight: 700; font-family: 'Lora', serif; line-height: 1.3; color: #0f172a; text-transform: uppercase;">${title}</h1>
          <p style="font-size: 14px; font-style: italic; color: #475569; margin-top: 20px;">${subtitle}</p>
        </div>
        <div style="margin-bottom: 80px; font-size: 12px; color: #475569; line-height: 1.8;">
          <p>A Thesis Submitted in Partial Fulfillment of the Requirements<br>for the Degree of Master of Science</p>
          <div style="width: 40px; height: 1px; background-color: #cbd5e1; margin: 20px auto;"></div>
          <p><strong>Candidate:</strong> ${author}</p>
          <p><strong>Advisor:</strong> Prof. Evelyn Hargreaves</p>
          <p><strong>Date:</strong> ${date}</p>
        </div>
      </div>
    `;
  }
  
  return '';
}

// Handwritten Signature Canvas Logic wrapper
export class SignatureDrawer {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.isDrawing = false;
    
    // Config strokes
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#0000ff'; // Blue signature ink
    
    this.setupListeners();
  }
  
  setupListeners() {
    // Mouse Down
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.ctx.beginPath();
      this.ctx.moveTo(
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top) * scaleY
      );
    });
    
    // Mouse Move
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDrawing) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.ctx.lineTo(
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top) * scaleY
      );
      this.ctx.stroke();
    });
    
    // Mouse Up / Leave
    const stopDrawing = () => {
      this.isDrawing = false;
      this.ctx.closePath();
    };
    this.canvas.addEventListener('mouseup', stopDrawing);
    this.canvas.addEventListener('mouseleave', stopDrawing);
    
    // Touch support for mobile/tablets
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.ctx.beginPath();
        this.ctx.moveTo(
          (e.touches[0].clientX - rect.left) * scaleX,
          (e.touches[0].clientY - rect.top) * scaleY
        );
        e.preventDefault();
      }
    });
    
    this.canvas.addEventListener('touchmove', (e) => {
      if (this.isDrawing && e.touches.length === 1) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.ctx.lineTo(
          (e.touches[0].clientX - rect.left) * scaleX,
          (e.touches[0].clientY - rect.top) * scaleY
        );
        this.ctx.stroke();
        e.preventDefault();
      }
    });
    
    this.canvas.addEventListener('touchend', stopDrawing);
  }
  
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  isEmpty() {
    // Test if canvas has any drawn pixels
    const buffer = new Uint32Array(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data.buffer);
    return !buffer.some(color => color !== 0);
  }
  
  getPNG() {
    return this.canvas.toDataURL('image/png');
  }

  // Draw a styled handwriting text on the signature canvas
  drawTypedName(nameText) {
    this.clear();
    this.ctx.font = 'bold 36px Caveat';
    this.ctx.fillStyle = '#0f172a'; // dark gray typed signature
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Draw cursive name
    this.ctx.fillText(nameText, this.canvas.width / 2, this.canvas.height / 2);
    
    // Draw signature line below
    this.ctx.strokeStyle = '#cbd5e1';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(30, this.canvas.height - 40);
    this.ctx.lineTo(this.canvas.width - 30, this.canvas.height - 40);
    this.ctx.stroke();
  }
}

// Generate QR Code wrapper (using QRCode.js)
export function createQRCodeImage(containerEl, url, callback) {
  // Clear container
  containerEl.innerHTML = '';
  
  // Initialize library
  new QRCode(containerEl, {
    text: url,
    width: 128,
    height: 128,
    colorDark : "#0f172a",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
  
  // The library takes a split second to render, we fetch the canvas image tag
  setTimeout(() => {
    const canvas = containerEl.querySelector('canvas');
    const img = containerEl.querySelector('img');
    const dataUrl = img ? img.src : (canvas ? canvas.toDataURL() : '');
    if (callback) callback(dataUrl);
  }, 150);
}
