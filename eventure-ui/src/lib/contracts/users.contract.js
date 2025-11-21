/**
 * USERS SERVICE contract (v0.1)
 *  - PATCH /users/me
 *      Req: { name?:string, email?:string }
 *      Res: { id, name, email, roles, avatarUrl? }
 *      Errors:
 *        400 { code:'ERR_VALIDATION' }
 *        409 { code:'ERR_EMAIL_EXISTS' }
 */
export const USERS_WRITE_ENDPOINTS = {
  UPDATE_ME: '/users/me'
};
