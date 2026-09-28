const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/aiEventController');
const { protect, admin } = require('../middleware/authMiddleware'); // [Guessing] names, see below

const limiter = rateLimit({ windowMs: 60_000, limit: 10 });

router.use(protect);

router.post('/generate', limiter, ctrl.generate);
router.post('/drafts', ctrl.createDraft);
router.get('/drafts/:id', ctrl.getDraft);
router.put('/drafts/:id', ctrl.updateDraft);

module.exports = router;