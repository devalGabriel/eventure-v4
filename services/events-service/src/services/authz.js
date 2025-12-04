// services/events-service/src/services/authz.js
// Helpers centralizate pentru autorizare (roluri) în events-service.

/**
 * Obține un identificator „canonic” pentru utilizator,
 * folosit în loguri, ownership etc.
 */
export function getUserId(user) {
  if (!user) return '';
  return (
    user?.userId?.toString?.() ||
    user?.id?.toString?.() ||
    user?.authUserId?.toString?.() ||
    ''
  );
}

/**
 * Obține un identificator generic pentru actor (pentru audit/logging).
 * Alias semantic peste getUserId – util dacă în viitor vrem să distingem
 * între auth user și profil intern.
 */
export function getActorId(user) {
  return getUserId(user);
}

/**
 * Verifică dacă user-ul este ADMIN, indiferent dacă rolul este:
 *  - user.role = 'admin'
 *  - user.roles = ['ADMIN', ...]
 *  - flag-uri booleene (isAdmin / isSuperAdmin)
 */
export function isAdminUser(user) {
  if (!user) return false;

  // câmp singular
  if (typeof user.role === 'string' && user.role.toLowerCase() === 'admin') {
    return true;
  }

  // listă de roluri (ex: ['ADMIN', 'CLIENT'])
  if (Array.isArray(user.roles)) {
    const hasAdmin = user.roles.some(
      (r) => String(r).toLowerCase() === 'admin'
    );
    if (hasAdmin) return true;
  }

  // flag-uri booleene
  if (user.isAdmin === true || user.isSuperAdmin === true) {
    return true;
  }

  return false;
}

/**
 * Verifică dacă user-ul are rol de PROVIDER.
 */
export function isProviderUser(user) {
  if (!user) return false;

  if (typeof user.role === 'string' && user.role.toLowerCase() === 'provider') {
    return true;
  }

  if (Array.isArray(user.roles)) {
    const hasProvider = user.roles.some(
      (r) => String(r).toLowerCase() === 'provider'
    );
    if (hasProvider) return true;
  }

  return false;
}

/**
 * Verifică dacă user-ul are rol de CLIENT.
 */
export function isClientUser(user) {
  if (!user) return false;

  if (typeof user.role === 'string' && user.role.toLowerCase() === 'client') {
    return true;
  }

  if (Array.isArray(user.roles)) {
    const hasClient = user.roles.some(
      (r) => String(r).toLowerCase() === 'client'
    );
    if (hasClient) return true;
  }

  return false;
}
