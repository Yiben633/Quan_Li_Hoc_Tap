import { logger } from '../../middlewares/logger.js';

export async function sendPasswordResetOtp(email: string, otp: string) {
  if (process.env.NODE_ENV !== 'production') {
    logger.info('mock_password_reset_otp', { email, otp });
  }
}
