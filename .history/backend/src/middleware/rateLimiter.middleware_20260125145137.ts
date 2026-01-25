import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // Increased to 1000 for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for localhost in development
  skip: (req) => {
    const ip = req.ip || '';
    return process.env.NODE_ENV === 'development' && 
           (ip === '127.0.0.1' || ip === '::1' || ip.includes('::ffff:127.0.0.1') || ip === 'localhost');
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased from 5 to 20 for development
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
  // Skip rate limiting for localhost in development
  skip: (req) => {
    const ip = req.ip || '';
    return process.env.NODE_ENV === 'development' && 
           (ip === '127.0.0.1' || ip === '::1' || ip.includes('::ffff:127.0.0.1') || ip === 'localhost');
  }
});

