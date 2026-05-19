import { authenticator } from 'otplib';
import QRCode from 'qrcode';

authenticator.options = { step: 30, digits: 6 };

export const generateTOTPSecret = (): string => {
  return authenticator.generateSecret();
};

export const verifyOTP = (token: string, secret: string): boolean => {
  return authenticator.verify({ token, secret });
};

export const generateQRCode = async (email: string, secret: string): Promise<string> => {
  const otpAuthUrl = authenticator.keyuri(email, 'AuthSystem', secret);
  return await QRCode.toDataURL(otpAuthUrl);
}; 