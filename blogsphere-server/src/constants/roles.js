const ROLES = Object.freeze({
  READER: 'reader',
  WRITER: 'writer',
  ADMIN: 'admin'
});

const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
});

module.exports = {
  ROLES,
  USER_STATUS
};
