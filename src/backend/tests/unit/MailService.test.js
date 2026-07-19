import { describe, it, expect } from 'vitest';
import nodemailer from 'nodemailer';
import mailService from '../../services/MailService.js';

// The mock in tests/setup.js returns the SAME sendMail fn for every transport,
// so calling createTransport() here yields the same spy the service uses.
const getSendMail = () => nodemailer.createTransport().sendMail;

describe('MailService', () => {
  describe('sendActivationEmail', () => {
    it('sends an activation email to the given address with the token link', async () => {
      const sendMail = getSendMail();

      await mailService.sendActivationEmail('customer@test.local', 'tok-123');

      expect(sendMail).toHaveBeenCalledTimes(1);
      const opts = sendMail.mock.calls[0][0];
      expect(opts.to).toBe('customer@test.local');
      expect(opts.subject).toContain('Kích hoạt');
      // The activation URL must embed the token and point at API_URL.
      expect(opts.html).toContain('token=tok-123');
      expect(opts.html).toContain(process.env.API_URL);
    });

    it('propagates transport errors to the caller', async () => {
      const sendMail = getSendMail();
      sendMail.mockRejectedValueOnce(new Error('SMTP down'));

      await expect(
        mailService.sendActivationEmail('x@test.local', 'tok')
      ).rejects.toThrow('SMTP down');
    });

    it('returns the transport result on success', async () => {
      const sendMail = getSendMail();
      sendMail.mockResolvedValueOnce({ messageId: 'abc' });

      const res = await mailService.sendActivationEmail('y@test.local', 'tok');
      expect(res).toEqual({ messageId: 'abc' });
    });
  });
});
