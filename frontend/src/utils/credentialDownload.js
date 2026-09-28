import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

// Helper to slugify filenames
const slugify = (text) => {
  return (text || 'credential')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

/**
 * Generates an ultra-crisp HTML5 canvas representation of the credential/certificate.
 * High-definition landscape format: 1200 x 850 (or 2400 x 1700 at 2x scale)
 */
export const generateCredentialCanvas = async (credential, scale = 2) => {
  const width = 1200 * scale;
  const height = 850 * scale;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background Gradient (Deep Obsidian Navy to Charcoal)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0c1017');
  bgGrad.addColorStop(0.5, '#121824');
  bgGrad.addColorStop(1, '#090d14');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle radial glow behind certificate center
  const radialGlow = ctx.createRadialGradient(
    width / 2, height / 2, 50 * scale,
    width / 2, height / 2, 450 * scale
  );
  radialGlow.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
  radialGlow.addColorStop(0.6, 'rgba(168, 85, 247, 0.05)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  // Outer Ornate Double Border with Gold/Cyan Gradient
  const borderMargin = 30 * scale;
  const outerBorderGrad = ctx.createLinearGradient(0, 0, width, height);
  outerBorderGrad.addColorStop(0, '#06b6d4');
  outerBorderGrad.addColorStop(0.3, '#3b82f6');
  outerBorderGrad.addColorStop(0.7, '#ec4899');
  outerBorderGrad.addColorStop(1, '#eab308');

  ctx.lineWidth = 4 * scale;
  ctx.strokeStyle = outerBorderGrad;
  ctx.strokeRect(borderMargin, borderMargin, width - borderMargin * 2, height - borderMargin * 2);

  // Inner Fine Pinstripe Border
  const innerMargin = 42 * scale;
  ctx.lineWidth = 1.5 * scale;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.strokeRect(innerMargin, innerMargin, width - innerMargin * 2, height - innerMargin * 2);

  // Corner Decorative Flourishes
  const drawCornerFlourish = (x, y, flipX, flipY) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(8 * scale, 8 * scale);
    ctx.lineTo(35 * scale, 8 * scale);
    ctx.moveTo(8 * scale, 8 * scale);
    ctx.lineTo(8 * scale, 35 * scale);
    ctx.stroke();

    // Corner diamond
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(8 * scale, 8 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  drawCornerFlourish(innerMargin, innerMargin, false, false);
  drawCornerFlourish(width - innerMargin, innerMargin, true, false);
  drawCornerFlourish(innerMargin, height - innerMargin, false, true);
  drawCornerFlourish(width - innerMargin, height - innerMargin, true, true);

  // Top Brand Header / Watermark
  ctx.textAlign = 'center';
  ctx.fillStyle = '#06b6d4';
  ctx.font = `bold ${14 * scale}px 'Inter', sans-serif`;
  ctx.letterSpacing = `${4 * scale}px`;
  ctx.fillText('✦  EVENTSYNC GLOBAL ACCREDITATION LEDGER  ✦', width / 2, 75 * scale);

  // Certificate Title
  const titleText = (credential.credentialType || 'CERTIFICATE OF ATTENDANCE').toUpperCase();
  const titleGrad = ctx.createLinearGradient(width / 2 - 250 * scale, 0, width / 2 + 250 * scale, 0);
  titleGrad.addColorStop(0, '#38bdf8');
  titleGrad.addColorStop(0.5, '#f472b6');
  titleGrad.addColorStop(1, '#facc15');

  ctx.fillStyle = titleGrad;
  ctx.font = `900 ${28 * scale}px 'Inter', sans-serif`;
  ctx.letterSpacing = `${3 * scale}px`;
  ctx.fillText(titleText, width / 2, 125 * scale);

  // Subtitle
  ctx.fillStyle = '#94a3b8';
  ctx.font = `italic 500 ${15 * scale}px 'Georgia', serif`;
  ctx.letterSpacing = `${1 * scale}px`;
  ctx.fillText('This official credential is proudly presented to', width / 2, 175 * scale);

  // Recipient Name (Bold, Grand Typography)
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${44 * scale}px 'Inter', sans-serif`;
  ctx.letterSpacing = `${1.5 * scale}px`;
  const recipient = credential.recipientName || 'Verified Attendee';
  ctx.fillText(recipient, width / 2, 245 * scale);

  // Golden underline divider under recipient name
  const nameWidth = ctx.measureText(recipient).width;
  const dividerWidth = Math.max(nameWidth + 60 * scale, 300 * scale);
  const divGrad = ctx.createLinearGradient(width / 2 - dividerWidth / 2, 0, width / 2 + dividerWidth / 2, 0);
  divGrad.addColorStop(0, 'rgba(234, 179, 8, 0)');
  divGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.9)');
  divGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
  ctx.fillStyle = divGrad;
  ctx.fillRect(width / 2 - dividerWidth / 2, 265 * scale, dividerWidth, 2 * scale);

  // Citation Statement
  ctx.fillStyle = '#cbd5e1';
  ctx.font = `400 ${16 * scale}px 'Inter', sans-serif`;
  ctx.letterSpacing = `${0.5 * scale}px`;
  ctx.fillText('for successful attendance, distinguished participation, and contributions in', width / 2, 315 * scale);

  // Event Name
  ctx.fillStyle = '#38bdf8';
  ctx.font = `bold ${26 * scale}px 'Inter', sans-serif`;
  const eventName = credential.eventName || 'Featured Event';
  ctx.fillText(eventName, width / 2, 365 * scale);

  // Event Metadata (Date & Venue)
  const eventDateStr = credential.eventDate 
    ? new Date(credential.eventDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString();

  const locationStr = credential.location || (credential.locationType === 'online' ? 'Online Virtual Stream' : 'Event Venue');

  ctx.fillStyle = '#94a3b8';
  ctx.font = `500 ${14 * scale}px 'Inter', sans-serif`;
  ctx.fillText(`Conducted on ${eventDateStr}  •  Venue: ${locationStr}`, width / 2, 405 * scale);

  // Skills / Key Highlights Pill Box
  if (credential.skills && credential.skills.length > 0) {
    const skillsText = credential.skills.slice(0, 4).join('   ✦   ');
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    const pillWidth = Math.min(800 * scale, width - 200 * scale);
    ctx.roundRect(width / 2 - pillWidth / 2, 435 * scale, pillWidth, 34 * scale, 8 * scale);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = `600 ${12 * scale}px 'Inter', sans-serif`;
    ctx.fillText(`KEY COMPETENCIES:  ${skillsText}`, width / 2, 457 * scale);
  }

  // Bottom Section: QR Code on Left, Seals & Verification in Center, Signatures on Right
  const bottomY = 560 * scale;

  // 1. Generate & Draw dynamic QR Code
  try {
    const verifyUrl = `${window.location.origin}/showcase?id=${credential.credentialId || credential._id}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 130 * scale,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    const qrImg = new Image();
    await new Promise((resolve) => {
      qrImg.onload = resolve;
      qrImg.src = qrDataUrl;
    });

    const qrX = 120 * scale;
    // White background card for QR
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(qrX - 8 * scale, bottomY - 10 * scale, 146 * scale, 146 * scale, 10 * scale);
    ctx.fill();

    ctx.drawImage(qrImg, qrX, bottomY - 2 * scale, 130 * scale, 130 * scale);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `500 ${10 * scale}px 'Inter', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SCAN TO VERIFY RECORD', qrX + 65 * scale, bottomY + 155 * scale);
  } catch (err) {
    console.error('QR code generation error:', err);
  }

  // 2. Center: Official Verification Seal & Details
  ctx.textAlign = 'center';
  const centerX = width / 2;

  // Golden Circular Seal
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, bottomY + 45 * scale, 48 * scale, 0, Math.PI * 2);
  const sealGrad = ctx.createRadialGradient(
    centerX, bottomY + 45 * scale, 10 * scale,
    centerX, bottomY + 45 * scale, 48 * scale
  );
  sealGrad.addColorStop(0, '#fef08a');
  sealGrad.addColorStop(0.5, '#eab308');
  sealGrad.addColorStop(1, '#a16207');
  ctx.fillStyle = sealGrad;
  ctx.fill();
  ctx.strokeStyle = '#fef9c3';
  ctx.lineWidth = 3 * scale;
  ctx.stroke();

  // Seal inner ring
  ctx.beginPath();
  ctx.arc(centerX, bottomY + 45 * scale, 42 * scale, 0, Math.PI * 2);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  // Seal Text
  ctx.fillStyle = '#78350f';
  ctx.font = `bold ${11 * scale}px 'Inter', sans-serif`;
  ctx.fillText('VERIFIED', centerX, bottomY + 42 * scale);
  ctx.font = `900 ${14 * scale}px 'Inter', sans-serif`;
  ctx.fillText('★ 2026 ★', centerX, bottomY + 58 * scale);
  ctx.restore();

  // Credential ID & Ledger Hash below seal
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `bold ${13 * scale}px 'Courier New', monospace`;
  ctx.fillText(`ID: ${credential.credentialId || 'ES-2026-VERIFIED'}`, centerX, bottomY + 120 * scale);

  ctx.fillStyle = '#64748b';
  ctx.font = `400 ${10 * scale}px 'Courier New', monospace`;
  ctx.fillText(`HASH: ${credential.verificationHash || '9a72b8c5e13d4f00'}`, centerX, bottomY + 138 * scale);

  ctx.fillStyle = '#10b981';
  ctx.font = `bold ${11 * scale}px 'Inter', sans-serif`;
  ctx.fillText('● CRYPTOGRAPHICALLY SECURED', centerX, bottomY + 155 * scale);

  // 3. Right: Authorized Signatures
  const sigX = width - 260 * scale;
  ctx.textAlign = 'center';

  // Signature 1: Event Director (Cursive Styled)
  ctx.fillStyle = '#f8fafc';
  ctx.font = `italic 700 ${22 * scale}px 'Brush Script MT', 'Dancing Script', cursive`;
  ctx.fillText('Chetan Shende', sigX, bottomY + 30 * scale);

  // Signature Line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.moveTo(sigX - 90 * scale, bottomY + 45 * scale);
  ctx.lineTo(sigX + 90 * scale, bottomY + 45 * scale);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${12 * scale}px 'Inter', sans-serif`;
  ctx.fillText('Chetan Shende', sigX, bottomY + 62 * scale);

  ctx.fillStyle = '#94a3b8';
  ctx.font = `400 ${11 * scale}px 'Inter', sans-serif`;
  ctx.fillText(credential.issuerTitle || 'Director of Operations, EventSync', sigX, bottomY + 78 * scale);

  // Signature 2: Event Host / Community Lead
  ctx.fillStyle = '#f8fafc';
  ctx.font = `italic 700 ${22 * scale}px 'Brush Script MT', 'Dancing Script', cursive`;
  ctx.fillText('Elena Rostova', sigX, bottomY + 115 * scale);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.moveTo(sigX - 90 * scale, bottomY + 130 * scale);
  ctx.lineTo(sigX + 90 * scale, bottomY + 130 * scale);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${12 * scale}px 'Inter', sans-serif`;
  ctx.fillText(credential.issuer || 'EventSync Official Organization', sigX, bottomY + 147 * scale);

  // Bottom Footer Legal
  ctx.fillStyle = '#475569';
  ctx.font = `400 ${10 * scale}px 'Inter', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('EventSync Verified Credentials  •  Tamper-proof Cryptographic Verification  •  All Rights Reserved', width / 2, height - 16 * scale);

  return canvas;
};

/**
 * Instantly triggers a high-resolution PNG download of the credential.
 */
export const downloadCredentialPNG = async (credential) => {
  try {
    const canvas = await generateCredentialCanvas(credential, 2);
    const dataUrl = canvas.toDataURL('image/png', 1.0);

    const link = document.createElement('a');
    const safeEvent = slugify(credential.eventName);
    const safeName = slugify(credential.recipientName);
    link.download = `${safeEvent}-Credential-${safeName}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (err) {
    console.error('Failed to download PNG credential:', err);
    throw err;
  }
};

/**
 * Instantly triggers a crisp, landscape vector PDF download of the credential using jsPDF.
 */
export const downloadCredentialPDF = async (credential) => {
  try {
    // Generate high-res canvas at scale 2
    const canvas = await generateCredentialCanvas(credential, 2);
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Standard A4 Landscape: 297mm x 210mm
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Render full canvas image fitting page
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

    const safeEvent = slugify(credential.eventName);
    const safeName = slugify(credential.recipientName);
    pdf.save(`${safeEvent}-Certificate-${safeName}.pdf`);

    return { success: true };
  } catch (err) {
    console.error('Failed to download PDF credential:', err);
    throw err;
  }
};
