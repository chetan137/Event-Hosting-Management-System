import API from './api';

const BASE = '/api/admin/event-ai';

// Keep the error shape the modal expects: err.status and err.data
const unwrap = (promise) =>
  promise
    .then((res) => res.data)
    .catch((err) => {
      const data = err.response?.data || {};
      const e = new Error(data.message || data.error || err.message || 'Request failed');
      e.status = err.response?.status;
      e.data = data;
      throw e;
    });

// Generation can take up to about a minute; the default axios timeout may be shorter
export const generateEventContent = (payload) =>
  unwrap(API.post(`${BASE}/generate`, payload, { timeout: 90000 }));

export const createDraft = (payload) => unwrap(API.post(`${BASE}/drafts`, payload));

export const updateDraft = (id, payload) => unwrap(API.put(`${BASE}/drafts/${id}`, payload));