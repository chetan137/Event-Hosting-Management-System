const { z } = require('zod');

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM 24h');
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

const AgendaItem = z.object({
  day: z.number().int().min(1).max(14).default(1),
  startTime: hhmm,
  endTime: hhmm,
  title: z.string().min(1).max(120),
  description: z.string().max(400),
  speaker: z.string().max(100).nullable(),
  type: z.enum(['registration', 'keynote', 'session', 'workshop', 'break', 'networking', 'other']),
});

const Agenda = z.array(AgendaItem).min(1).max(40).superRefine((items, ctx) => {
  items.forEach((it, i) => {
    if (toMin(it.endTime) <= toMin(it.startTime)) {
      ctx.addIssue({ code: 'custom', path: [i, 'endTime'], message: 'endTime must be after startTime' });
    }
    if (i > 0) {
      const prev = items[i - 1];
      if (it.day < prev.day) {
        ctx.addIssue({ code: 'custom', path: [i, 'day'], message: 'items must be ordered by day' });
      } else if (it.day === prev.day && toMin(it.startTime) < toMin(prev.endTime)) {
        ctx.addIssue({ code: 'custom', path: [i, 'startTime'], message: 'overlaps previous item' });
      }
    }
  });
});

const GeneratedContent = z.object({
  title: z.string().min(1).max(120),
  marketingDescriptionHtml: z.string().min(50).max(4000),
  agenda: z.array(AgendaItem).min(1).max(40),
});

const GenerateInput = z.object({
  bullets: z.array(z.string().trim().min(1).max(300)).min(1).max(30),
  tone: z.enum(['professional', 'friendly', 'energetic', 'formal']).default('professional'),
  audience: z.string().max(200).optional(),
  startTime: hhmm.optional(),
});

const DraftInput = z.object({
  title: z.string().min(1).max(120),
  descriptionHtml: z.string().max(8000),
  agenda: Agenda,
  sourceBullets: z.array(z.string()).max(30).optional(),
});

module.exports = { AgendaItem, Agenda, GeneratedContent, GenerateInput, DraftInput };