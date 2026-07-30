export const AuditEvent = {
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILED: 'auth.login.failed',
  LOGOUT: 'auth.logout',
  PASSWORD_CHANGED: 'auth.password.changed',
  PASSWORD_RESET: 'auth.password.reset',
  PASSWORD_RESET_REQUESTED: 'auth.password.reset_requested',
  REGISTER: 'auth.register',
  EMAIL_VERIFIED: 'auth.email.verified',
  TOKEN_REUSE_DETECTED: 'auth.token.reuse_detected',
  ROLE_CHANGED: 'admin.role.changed',

  APPOINTMENT_CREATED: 'appointment.created',
  APPOINTMENT_CONFIRMED: 'appointment.confirmed',
  APPOINTMENT_CANCELLED: 'appointment.cancelled',
  APPOINTMENT_COMPLETED: 'appointment.completed',
  APPOINTMENT_STATUS_CHANGED: 'appointment.status_changed',
  APPOINTMENT_RESCHEDULED: 'appointment.rescheduled',
  APPOINTMENT_NO_SHOW: 'appointment.no_show',

  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DEACTIVATED: 'user.deactivated',

  SETTING_CHANGED: 'setting.changed',
  SERVICE_CREATED: 'service.created',
  SERVICE_UPDATED: 'service.updated',
  SERVICE_DELETED: 'service.deleted',
  REVIEW_MODERATED: 'review.moderated',
} as const;

export type AuditEventType = (typeof AuditEvent)[keyof typeof AuditEvent];
