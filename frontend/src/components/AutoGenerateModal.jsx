import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { generateEventContent, createDraft, updateDraft } from '../services/eventAiApi';

const TONES = ['professional', 'friendly', 'energetic', 'formal'];

function friendlyError(e) {
  if (e.status === 401 || e.status === 403) return 'Your session has expired or you are not an admin. Log in again.';
  if (e.status === 429) return 'Too many requests. Wait a minute and try again.';
  if (e.status === 503) return 'The AI service is busy. Try again in a moment.';
  if (e.status === 422) return 'The AI produced a schedule that failed validation. Add explicit times to your notes and retry.';
  if (e.status === 400 && Array.isArray(e.data?.issues)) {
    return e.data.issues.map((i) => `${i.path?.join('.') || 'input'}: ${i.message}`).join(' | ');
  }
  return e.message || 'Something went wrong.';
}

const input = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const label = 'mb-1 mt-4 block text-sm font-semibold text-gray-800';
const btn = 'rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm text-gray-800 hover:bg-gray-200 disabled:opacity-50';
const primary = 'rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50';

export default function AutoGenerateModal({ open, onClose, onAccept }) {
  const [bulletsText, setBulletsText] = useState('');
  const [tone, setTone] = useState('professional');
  const [audience, setAudience] = useState('');
  const [startTime, setStartTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [generated, setGenerated] = useState(false);
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState([]);
  const [draftId, setDraftId] = useState(null);

  const editor = useEditor({ extensions: [StarterKit], content: '' });

  if (!open) return null;

  const getBullets = () => bulletsText.split('\n').map((b) => b.trim()).filter(Boolean);

  const reset = () => {
    setBulletsText('');
    setTone('professional');
    setAudience('');
    setStartTime('');
    setError('');
    setNotice('');
    setGenerated(false);
    setTitle('');
    setAgenda([]);
    setDraftId(null);
    editor?.commands.setContent('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleGenerate = async () => {
    const bullets = getBullets();
    if (!bullets.length) return setError('Add at least one bullet point.');
    if (bullets.length > 30) return setError('Maximum 30 bullet points.');
    if (bullets.some((b) => b.length > 300)) return setError('Each bullet must be under 300 characters.');

    setLoading(true);
    setError('');
    setNotice('');
    try {
      const data = await generateEventContent({
        bullets,
        tone,
        ...(audience.trim() && { audience: audience.trim() }),
        ...(startTime && { startTime }),
      });
      setTitle(data.title);
      setAgenda(data.agenda);
      editor?.commands.setContent(data.marketingDescriptionHtml);
      setDraftId(null);
      setGenerated(true);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (i, patch) => setAgenda((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i) => setAgenda((rows) => rows.filter((_, idx) => idx !== i));

  // /generate returns marketingDescriptionHtml; the drafts API expects descriptionHtml
  const buildPayload = () => ({
    title,
    descriptionHtml: editor?.getHTML() ?? '',
    agenda: agenda.map((r) => ({ ...r, day: Number(r.day) || 1 })),
    sourceBullets: getBullets(),
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = buildPayload();
      const saved = draftId ? await updateDraft(draftId, payload) : await createDraft(payload);
      setDraftId(saved._id);
      setNotice('Draft saved.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = () => {
    onAccept({ ...buildPayload(), draftId });
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 text-gray-900 shadow-xl">
        <h2 className="text-xl font-bold">Auto-Generate with AI</h2>

        <label className={label}>Event notes (one bullet per line)</label>
        <textarea
          className={`${input} min-h-[110px]`}
          value={bulletsText}
          onChange={(e) => setBulletsText(e.target.value)}
          placeholder={'Annual developer meetup, doors open 9am\nKeynote on AI by Priya, 45 min\nLunch at 12:30 for one hour'}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className={label}>Tone</label>
            <select className={input} value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Audience (optional)</label>
            <input className={input} value={audience} onChange={(e) => setAudience(e.target.value)} />
          </div>
          <div>
            <label className={label}>Start time (optional)</label>
            <input className={input} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
        </div>

        <div className="my-4">
          <button type="button" className={primary} onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating… (can take up to a minute)' : generated ? 'Regenerate' : 'Generate'}
          </button>
        </div>

        {error && <div className="my-3 rounded-md bg-red-100 p-3 text-sm text-red-800">{error}</div>}
        {notice && <div className="my-3 rounded-md bg-green-100 p-3 text-sm text-green-800">{notice}</div>}

        {generated && (
          <>
            <label className={label}>Title</label>
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />

            <label className={label}>Description</label>
            <div className="mb-2 flex gap-2">
              <button type="button" className={btn} onClick={() => editor?.chain().focus().toggleBold().run()}><b>B</b></button>
              <button type="button" className={btn} onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></button>
              <button type="button" className={btn} onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</button>
            </div>
            <div className="rounded-md border border-gray-300 p-2 [&_.ProseMirror]:min-h-[140px] [&_.ProseMirror]:outline-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_p]:mb-2">
              <EditorContent editor={editor} />
            </div>

            <label className={label}>Agenda (review every row, AI can guess times)</label>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="p-1">Day</th><th className="p-1">Start</th><th className="p-1">End</th><th className="p-1">Title</th><th />
                  </tr>
                </thead>
                <tbody>
                  {agenda.map((r, i) => (
                    <tr key={i}>
                      <td className="p-1"><input className={`${input} w-16`} type="number" min="1" value={r.day ?? 1} onChange={(e) => updateRow(i, { day: e.target.value })} /></td>
                      <td className="p-1"><input className={input} type="time" value={r.startTime} onChange={(e) => updateRow(i, { startTime: e.target.value })} /></td>
                      <td className="p-1"><input className={input} type="time" value={r.endTime} onChange={(e) => updateRow(i, { endTime: e.target.value })} /></td>
                      <td className="p-1"><input className={input} value={r.title} onChange={(e) => updateRow(i, { title: e.target.value })} /></td>
                      <td className="p-1"><button type="button" className={btn} onClick={() => removeRow(i)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btn} onClick={handleClose}>Cancel</button>
          {generated && (
            <>
              <button type="button" className={btn} onClick={handleSaveDraft} disabled={saving}>
                {saving ? 'Saving…' : draftId ? 'Update draft' : 'Save as draft'}
              </button>
              <button type="button" className={primary} onClick={handleAccept}>Use in event form</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
