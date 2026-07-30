const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export const STRICT_TRANSPORT_SECURITY = 'max-age=63072000; includeSubDomains; preload';
export const X_CONTENT_TYPE_OPTIONS = 'nosniff';
export const X_FRAME_OPTIONS = 'DENY';
export const X_XSS_PROTECTION = '0';
export const REFERRER_POLICY = 'strict-origin-when-cross-origin';
export const PERMISSIONS_POLICY = [
  'accelerometer=()',
  'autoplay=()',
  'camera=()',
  'display-capture=()',
  'encrypted-media=()',
  'fullscreen=(self)',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'midi=()',
  'payment=()',
  'picture-in-picture=()',
  'publickey-credentials-get=()',
  'screen-wake-lock=()',
  'sync-xhr=()',
  'usb=()',
  'web-share=(self)',
  'xr-spatial-tracking=()',
].join(', ');
export { CSP_HEADER };
