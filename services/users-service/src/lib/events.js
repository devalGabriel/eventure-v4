module.exports = {
  IN: {
    AUTH_USER_REGISTERED: process.env.NATS_TOPIC_AUTH_USER_REGISTERED || 'auth.user.registered'
  },
  OUT: {
    USERS_PROFILE_UPDATED: process.env.NATS_TOPIC_USERS_PROFILE_UPDATED || 'users.profile.updated',
    USERS_ROLE_UPDATED: process.env.NATS_TOPIC_USERS_ROLE_UPDATED || 'users.role.updated',
    USERS_DELETED: process.env.NATS_TOPIC_USERS_DELETED || 'users.deleted'
  }
};
