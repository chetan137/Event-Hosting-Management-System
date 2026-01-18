// Helper function to broadcast event updates to all users in that event room
const broadcastEventUpdate = (io, eventId, eventData) => {
  if (io) {
    io.to(`event-${eventId}`).emit('event-updated', eventData);
    console.log(`📡 Broadcasted event update for event: ${eventId}`);
  }
};

// Helper function to broadcast attendee updates
const broadcastAttendeesUpdate = (io, eventId, attendeesData) => {
  if (io) {
    io.to(`event-${eventId}`).emit('attendees-updated', attendeesData);
    console.log(`📡 Broadcasted attendees update for event: ${eventId}`);
  }
};

module.exports = {
  broadcastEventUpdate,
  broadcastAttendeesUpdate
};
