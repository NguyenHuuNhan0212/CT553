const sessions = {};

function getSession(userId) {
  return sessions[userId] || {};
}

function setSession(userId, data) {
  sessions[userId] = { ...sessions[userId], ...data };
}

function clearSession(userId) {
  delete sessions[userId];
}

module.exports = { getSession, setSession, clearSession };
