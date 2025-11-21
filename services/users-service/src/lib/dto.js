function mapUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone ?? null,
    locale: user.locale ?? 'ro-RO',
    avatarUrl: user.avatarUrl ?? null,
    isActive: user.isActive,
    roles: user.roles?.map(r => r.name) ?? [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function mapUsers(items) {
  return items.map(mapUser);
}

module.exports = { mapUser, mapUsers };
