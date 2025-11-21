// services/users-service/src/lib/dto.js

function mapUser(user) {
  if (!user) return null;

  const roles = user.roles?.map((r) => r.name) ?? [];

  // rol „principal” pentru UI (admin/client/provider)
  let primaryRole = null;
  if (roles.includes('ADMIN')) primaryRole = 'admin';
  else if (roles.includes('PROVIDER')) primaryRole = 'provider';
  else if (roles.includes('CLIENT')) primaryRole = 'client';

  return {
    // ⚠️ CANONIC: id = UserProfile.id (UUID din users-service)
    id: user.id,
    authUserId: user.authUserId ?? null, // id din auth-service (numeric sau string)
    email: user.email,
    fullName: user.fullName,
    phone: user.phone ?? null,
    locale: user.locale ?? 'ro-RO',
    avatarUrl: user.avatarUrl ?? null,
    isActive: user.isActive,
    roles,          // ex. ['ADMIN','CLIENT']
    role: primaryRole, // ex. 'admin' – pentru UI
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function mapUsers(items) {
  return items.map(mapUser);
}

module.exports = { mapUser, mapUsers };
