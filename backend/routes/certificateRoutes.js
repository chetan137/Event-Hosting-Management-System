const express = require('express');
const router = express.Router();
const {
  generateCertificate,
  issueAdminCertificate,
  getMyCertificates,
  getCertificateByIdOrNumber,
  verifyCertificate,
  downloadCertificatePdf,
  toggleCertificatePrivacy,
  getShowcaseGallery
} = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');

// Public Showcase Gallery Aggregation Endpoint
router.get('/showcase', getShowcaseGallery);
router.get('/gallery', getShowcaseGallery);

// Public Verification Endpoint
router.get('/verify/:certificateNumber', verifyCertificate);

// User Protected Routes
router.get('/my-certificates', protect, getMyCertificates);
router.post('/generate', protect, generateCertificate);
router.put('/:id/privacy', protect, toggleCertificatePrivacy);

// Admin Protected Routes
router.post('/admin/issue', protect, issueAdminCertificate);

// Public Certificate Details and PDF Download
router.get('/:identifier', getCertificateByIdOrNumber);
router.get('/:identifier/pdf', downloadCertificatePdf);

module.exports = router;
