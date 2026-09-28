// backend/controllers/aiEventController.js
const { GenerateInput, DraftInput } = require('../validators/eventAiSchemas');
const { generateEventContent, cleanHtml } = require('../services/geminiService');
const EventDraft = require('../models/EventDraft');

exports.generate = async (req, res) => {
  const parsed = GenerateInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input', issues: parsed.error.issues });
  try {
    res.json(await generateEventContent(parsed.data));
  } catch (e) {
    console.error('[AI generate]', e);
    if (e.status === 422) {
      return res.status(422).json({ error: 'invalid_model_output', message: e.message });
    }
    if (e.retryable) {
      return res.status(503).json({
        error: 'ai_busy',
        retryable: true,
        message: 'The AI service is busy right now. Please try again in a moment.',
      });
    }
    res.status(502).json({ error: 'ai_upstream_error', message: 'AI generation failed.' });
  }
};

exports.createDraft = async (req, res) => {
  const parsed = DraftInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_draft', issues: parsed.error.issues });
  try {
    const draft = await EventDraft.create({
      ...parsed.data,
      descriptionHtml: cleanHtml(parsed.data.descriptionHtml),
      createdBy: req.user?._id,
    });
    res.status(201).json(draft);
  } catch (e) {
    console.error('[AI createDraft]', e);
    res.status(500).json({ error: 'draft_save_failed' });
  }
};

exports.getDraft = async (req, res) => {
  try {
    const draft = await EventDraft.findById(req.params.id);
    draft ? res.json(draft) : res.status(404).json({ error: 'not_found' });
  } catch (e) {
    res.status(400).json({ error: 'invalid_id' });
  }
};

exports.updateDraft = async (req, res) => {
  const parsed = DraftInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_draft', issues: parsed.error.issues });
  try {
    const draft = await EventDraft.findByIdAndUpdate(
      req.params.id,
      { ...parsed.data, descriptionHtml: cleanHtml(parsed.data.descriptionHtml) },
      { new: true }
    );
    draft ? res.json(draft) : res.status(404).json({ error: 'not_found' });
  } catch (e) {
    res.status(400).json({ error: 'invalid_id' });
  }
};