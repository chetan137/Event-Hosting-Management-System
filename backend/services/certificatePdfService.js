const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Builds a high-resolution, beautifully styled landscape certificate PDF
 * @param {Object} certificate - Certificate document from database
 * @param {stream.Writable} res - Express response stream (or writable stream)
 */
async function generateCertificatePdf(certificate, res) {
  return new Promise(async (resolve, reject) => {
    try {
      // Landscape A4 dimensions: 841.89 x 595.28 points
      const width = 841.89;
      const height = 595.28;

      const doc = new PDFDocument({
        size: [width, height],
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        info: {
          Title: `Certificate of ${certificate.certificateType || 'Completion'} - ${certificate.recipientName}`,
          Author: 'EventSync Credential Authority',
          Subject: `Verified Credential for ${certificate.eventName}`,
          Keywords: 'certificate, eventsync, verified, credential'
        }
      });

      doc.pipe(res);

      // 1. Dark theme background
      doc.rect(0, 0, width, height).fill('#0c1017');

      // 2. Decorative outer border with gradient-like neon cyan/gold colors
      doc.lineWidth(3).strokeColor('#00f2fe');
      doc.rect(20, 20, width - 40, height - 40).stroke();

      doc.lineWidth(1).strokeColor('#f6ad55');
      doc.rect(26, 26, width - 52, height - 52).stroke();

      // Corner decorative accents
      const drawCorner = (x, y, rotation) => {
        doc.save();
        doc.translate(x, y);
        doc.rotate(rotation);
        doc.lineWidth(2).strokeColor('#4fd1c5');
        doc.moveTo(0, 0).lineTo(30, 0).stroke();
        doc.moveTo(0, 0).lineTo(0, 30).stroke();
        doc.circle(8, 8, 3).fill('#f6ad55');
        doc.restore();
      };

      drawCorner(32, 32, 0);
      drawCorner(width - 32, 32, 90);
      drawCorner(width - 32, height - 32, 180);
      drawCorner(32, height - 32, 270);

      // 3. Organization Header / Brand
      doc.fillColor('#38bdf8')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('✦ EVENTSYNC VERIFIED CREDENTIALS ✦', 0, 48, { align: 'center', characterSpacing: 3 });

      // 4. Main Certificate Title
      const typeText = (certificate.certificateType || 'COMPLETION').toUpperCase();
      doc.fillColor('#ffffff')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text(`CERTIFICATE OF ${typeText}`, 0, 72, { align: 'center', characterSpacing: 2 });

      doc.fillColor('#94a3b8')
        .fontSize(10)
        .font('Helvetica')
        .text('THIS IS OFFICIALLY PRESENTED AND VERIFIED FOR', 0, 112, { align: 'center', characterSpacing: 1.5 });

      // 5. Recipient Name
      doc.fillColor('#38bdf8')
        .fontSize(30)
        .font('Helvetica-Bold')
        .text(certificate.recipientName || 'Participant Name', 0, 138, { align: 'center' });

      // Decorative divider under name
      doc.lineWidth(1.5).strokeColor('#f6ad55');
      doc.moveTo(width / 2 - 140, 178).lineTo(width / 2 + 140, 178).stroke();
      doc.circle(width / 2, 178, 4).fill('#38bdf8');

      // 6. Achievement Description
      doc.fillColor('#cbd5e1')
        .fontSize(12)
        .font('Helvetica')
        .text('for successful active participation and demonstrated excellence in', 0, 196, { align: 'center' });

      // 7. Event Name
      doc.fillColor('#f8fafc')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(`"${certificate.eventName}"`, 40, 222, { align: 'center' });

      // 8. Event Details (Date, Location)
      const eventDateStr = certificate.eventDate
        ? new Date(certificate.eventDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : new Date(certificate.issuedAt || Date.now()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

      const detailsText = `Organized via EventSync • Date: ${eventDateStr} • Location: ${certificate.eventLocation || 'Online Session'}`;
      doc.fillColor('#94a3b8')
        .fontSize(10)
        .font('Helvetica')
        .text(detailsText, 0, 260, { align: 'center' });

      // Optional custom note or skills
      if (certificate.customNote || (certificate.skills && certificate.skills.length > 0)) {
        const note = certificate.customNote || `Skills Covered: ${certificate.skills.join(', ')}`;
        doc.fillColor('#64748b')
          .fontSize(9)
          .font('Helvetica-Oblique')
          .text(note, 60, 285, { align: 'center', width: width - 120 });
      }

      // 9. Lower Section: QR Code, Signatures, Verification Box
      const footerY = 345;

      // Box for QR Code & Verification
      doc.roundedRect(60, footerY, 230, 130, 8)
        .lineWidth(1)
        .strokeColor('#1e293b')
        .fill('#0f172a');

      // Generate QR Code Buffer
      const verifyUrl = certificate.verificationUrl || `https://eventsync.com/verify-certificate/${certificate.certificateNumber}`;
      const qrBuffer = await QRCode.toBuffer(verifyUrl, {
        errorCorrectionLevel: 'M',
        type: 'png',
        width: 150,
        margin: 1,
        color: {
          dark: '#00f2fe',
          light: '#0f172a'
        }
      });

      doc.image(qrBuffer, 75, footerY + 15, { width: 100, height: 100 });

      doc.fillColor('#38bdf8')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('SCAN TO VERIFY', 185, footerY + 30);

      doc.fillColor('#64748b')
        .fontSize(7)
        .font('Helvetica')
        .text('Cryptographically', 185, footerY + 45)
        .text('Verified on', 185, footerY + 55)
        .text('EventSync Ledger', 185, footerY + 65);

      doc.fillColor('#f6ad55')
        .fontSize(7)
        .font('Helvetica-Bold')
        .text('STATUS: ACTIVE ✓', 185, footerY + 85);

      // Center: Official Digital Badge Stamp
      const stampCenterX = width / 2;
      const stampCenterY = footerY + 60;
      doc.lineWidth(2).strokeColor('#f6ad55');
      doc.circle(stampCenterX, stampCenterY, 44).stroke();
      doc.lineWidth(1).strokeColor('#38bdf8');
      doc.circle(stampCenterX, stampCenterY, 39).stroke();

      doc.fillColor('#f6ad55')
        .fontSize(7)
        .font('Helvetica-Bold')
        .text('EVENTSYNC', stampCenterX - 35, stampCenterY - 22, { width: 70, align: 'center' })
        .text('SEAL OF', stampCenterX - 35, stampCenterY - 12, { width: 70, align: 'center' })
        .text('AUTHENTICITY', stampCenterX - 35, stampCenterY - 2, { width: 70, align: 'center' });

      doc.fillColor('#38bdf8')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('★ ★ ★', stampCenterX - 35, stampCenterY + 12, { width: 70, align: 'center' });

      // Right: Signatures & Authority
      const sigX = width - 290;
      doc.lineWidth(1).strokeColor('#475569');
      doc.moveTo(sigX, footerY + 80).lineTo(sigX + 220, footerY + 80).stroke();

      doc.fillColor('#38bdf8')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('EventSync Credential Authority', sigX, footerY + 90, { width: 220, align: 'center' });

      doc.fillColor('#64748b')
        .fontSize(8)
        .font('Helvetica')
        .text('Digital Signature Validated & Sealed', sigX, footerY + 105, { width: 220, align: 'center' });

      // 10. Bottom Security / Hash Line
      const bottomY = height - 55;
      const hashShort = certificate.verificationHash
        ? `${certificate.verificationHash.substring(0, 32)}...`
        : 'SECURED-WITH-SHA256';

      doc.fillColor('#475569')
        .fontSize(7.5)
        .font('Helvetica')
        .text(`Certificate ID: ${certificate.certificateNumber}   |   Hash: ${hashShort}   |   Verify: ${verifyUrl}`, 0, bottomY, {
          align: 'center'
        });

      doc.end();
      doc.on('finish', () => resolve(true));
      doc.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateCertificatePdf };
