// Fire-and-forget analytics tracking stub.
// Schema: { event_name, user_id, action_type, timestamp, metadata }
// NOTE: Data Analytics team will wire the real POST endpoint here.
// This stub intentionally does nothing — it must never throw or reject.
const track = (payload) => {
  try {
    // TODO: replace with real tracking call when Data Analytics provides the endpoint.
    // e.g. API.post('/api/track', payload).catch(() => {});
    void payload;
  } catch (_) {
    // swallow silently
  }
};

module.exports = track;
