import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const qrcode = require('qrcode') as { toDataURL: (text: string) => Promise<string> };

@Injectable()
export class TotpService {
  constructor() {
    authenticator.options = {
      window: 1, // Accept ±1 time step for clock drift
      step: 30,
      digits: 6,
    };
  }

  async generateSecret(email: string): Promise<{
    secret: string;
    otpauthUrl: string;
    qrCode: string;
  }> {
    const secret = authenticator.generateSecret(20);
    const otpauthUrl = authenticator.keyuri(email, 'HRMS', secret);
    const qrCode = await qrcode.toDataURL(otpauthUrl);
    return { secret, otpauthUrl, qrCode };
  }

  verify(secret: string, token: string): boolean {
    return authenticator.verify({ token, secret });
  }
}
