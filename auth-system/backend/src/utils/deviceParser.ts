import { Request } from 'express';
import UAParser from 'ua-parser-js';

export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  ip: string;
}

export const parseDevice = (req: Request): DeviceInfo => {
  const ua = req.headers['user-agent'] || '';
  const parser = new UAParser(ua);
  const result = parser.getResult();

  const browser = result.browser.name
    ? `${result.browser.name} ${result.browser.version || ''}`.trim()
    : 'Unknown Browser';

  const os = result.os.name
    ? `${result.os.name} ${result.os.version || ''}`.trim()
    : 'Unknown OS';

  const device = result.device.type || 'desktop';

  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'Unknown';

  return { browser, os, device, ip };
}; 