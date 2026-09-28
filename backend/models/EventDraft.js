const mongoose = require('mongoose');

const agendaItemSchema = new mongoose.Schema({
  startTime: String, endTime: String, title: String,
  description: String, speaker: { type: String, default: null }, type: String,
}, { _id: false });

const eventDraftSchema = new mongoose.Schema({
  title: { type: String, required: true },
  descriptionHtml: String,
  agenda: [agendaItemSchema],
  sourceBullets: [String],
  status: { type: String, default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('EventDraft', eventDraftSchema);