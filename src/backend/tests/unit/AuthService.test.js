import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OAuth2Client } from 'google-auth-library';
import authService from '../../services/AuthService.js';
import mailService from '../../services/MailService.js';
import User from '../../models/User.js';
import { createUser } from '../helpers/factories.js';

// Lấy về instance verifyIdToken dùng chung do mock google-auth-library tạo ra.
const getVerifyIdToken = () => new OAuth2Client().verifyIdToken;

describe('AuthService.register', () => {
  it('happy path: tạo user chưa kích hoạt và gửi email kích hoạt', async () => {
    const spy = vi.spyOn(mailService, 'sendActivationEmail').mockResolvedValue({});
    const result = await authService.register({
      username: 'NewUser',
      email: 'New@Test.local',
      password: 'password123',
      first_name: 'New',
      last_name: 'User'
    });

    expect(result.email).toBe('new@test.local');
    expect(result.username).toBe('newuser');
    // Các trường nhạy cảm phải bị loại bỏ khỏi kết quả trả về.
    expect(result.password).toBeUndefined();
    expect(result.verify_token).toBeUndefined();
    expect(result.verify_token_expires).toBeUndefined();
    expect(result.google_id).toBeUndefined();

    const stored = await User.findOne({ email: 'new@test.local' });
    expect(stored.is_email_verified).toBe(false);
    expect(stored.verify_token).toBeTruthy();
    expect(stored.verify_token_expires.getTime()).toBeGreaterThan(Date.now());
    expect(spy).toHaveBeenCalledWith('new@test.local', stored.verify_token);
  });

  it('vẫn tạo user thành công dù gửi email thất bại (nuốt lỗi mail)', async () => {
    vi.spyOn(mailService, 'sendActivationEmail').mockRejectedValue(new Error('SMTP down'));
    const result = await authService.register({
      username: 'user_mailfail',
      email: 'mailfail@test.local',
      password: 'password123',
      first_name: 'Mail',
      last_name: 'Fail'
    });
    expect(result.email).toBe('mailfail@test.local');
    expect(await User.findOne({ email: 'mailfail@test.local' })).not.toBeNull();
  });

  it('ném lỗi 409 khi email trùng (không phân biệt hoa thường)', async () => {
    vi.spyOn(mailService, 'sendActivationEmail').mockResolvedValue({});
    await createUser({ username: 'existing', email: 'dup@test.local' });
    await expect(authService.register({
      username: 'brandnew',
      email: 'DUP@test.local',
      password: 'password123',
      first_name: 'Dup',
      last_name: 'Email'
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('ném lỗi 409 khi username trùng', async () => {
    vi.spyOn(mailService, 'sendActivationEmail').mockResolvedValue({});
    await createUser({ username: 'taken', email: 'first@test.local' });
    await expect(authService.register({
      username: 'Taken',
      email: 'second@test.local',
      password: 'password123',
      first_name: 'Dup',
      last_name: 'Name'
    })).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('AuthService.resendVerificationEmail', () => {
  beforeEach(() => {
    vi.spyOn(mailService, 'sendActivationEmail').mockResolvedValue({});
  });

  it('happy path: cấp token mới và gửi lại email', async () => {
    const user = await createUser({ email: 'resend@test.local', is_email_verified: false });
    const before = user.verify_token;
    const ok = await authService.resendVerificationEmail('RESEND@test.local');
    expect(ok).toBe(true);
    const updated = await User.findById(user._id);
    expect(updated.verify_token).toBeTruthy();
    expect(updated.verify_token).not.toBe(before);
    expect(mailService.sendActivationEmail).toHaveBeenCalledOnce();
  });

  it('404 khi email không tồn tại', async () => {
    await expect(authService.resendVerificationEmail('nobody@test.local'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('400 khi tài khoản đã kích hoạt', async () => {
    await createUser({ email: 'already@test.local', is_email_verified: true });
    await expect(authService.resendVerificationEmail('already@test.local'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('403 khi tài khoản bị khóa (deleted_at != null)', async () => {
    await createUser({ email: 'locked@test.local', is_email_verified: false, deleted_at: new Date() });
    await expect(authService.resendVerificationEmail('locked@test.local'))
      .rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('AuthService.verifyEmail', () => {
  it('happy path: token hợp lệ kích hoạt tài khoản và xóa token', async () => {
    const user = await createUser({ is_email_verified: false });
    user.verify_token = 'valid-token';
    user.verify_token_expires = new Date(Date.now() + 60000);
    await user.save();

    const ok = await authService.verifyEmail('valid-token');
    expect(ok).toBe(true);
    const updated = await User.findById(user._id);
    expect(updated.is_email_verified).toBe(true);
    expect(updated.verify_token).toBeNull();
    expect(updated.verify_token_expires).toBeNull();
  });

  it('400 khi token không tồn tại', async () => {
    await expect(authService.verifyEmail('nonexistent'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('400 khi token đã hết hạn', async () => {
    const user = await createUser({ is_email_verified: false });
    user.verify_token = 'expired-token';
    user.verify_token_expires = new Date(Date.now() - 1000);
    await user.save();
    await expect(authService.verifyEmail('expired-token'))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('AuthService.login', () => {
  it('happy path: trả token + user khi thông tin đúng', async () => {
    await createUser({ username: 'loginuser', password: 'password123', is_email_verified: true });
    const result = await authService.login('LoginUser', 'password123');
    expect(result.token).toBeTruthy();
    expect(result.user.username).toBe('loginuser');
    expect(result.user.password).toBeUndefined();
  });

  it('401 khi user không tồn tại', async () => {
    await expect(authService.login('ghost', 'password123'))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('401 khi sai mật khẩu', async () => {
    await createUser({ username: 'wrongpass', password: 'password123' });
    await expect(authService.login('wrongpass', 'incorrect'))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('403 khi tài khoản bị khóa', async () => {
    await createUser({ username: 'lockeduser', password: 'password123', deleted_at: new Date() });
    await expect(authService.login('lockeduser', 'password123'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('403 khi tài khoản chưa kích hoạt email', async () => {
    await createUser({ username: 'unverified', password: 'password123', is_email_verified: false });
    await expect(authService.login('unverified', 'password123'))
      .rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('AuthService.googleLogin', () => {
  const payload = {
    sub: 'google-sub-123',
    email: 'guser@gmail.com',
    given_name: 'Google',
    family_name: 'User',
    picture: 'http://pic'
  };

  it('happy path: tạo user mới từ payload Google', async () => {
    getVerifyIdToken().mockResolvedValue({ getPayload: () => payload });
    const result = await authService.googleLogin('valid-id-token');
    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe('guser@gmail.com');
    const stored = await User.findOne({ email: 'guser@gmail.com' });
    expect(stored.google_id).toBe('google-sub-123');
    expect(stored.is_email_verified).toBe(true);
  });

  it('liên kết google_id vào user hiện có (đăng nhập bằng email trùng)', async () => {
    await createUser({ email: 'guser@gmail.com', is_email_verified: false });
    getVerifyIdToken().mockResolvedValue({ getPayload: () => payload });
    const result = await authService.googleLogin('valid-id-token');
    expect(result.user.email).toBe('guser@gmail.com');
    const stored = await User.findOne({ email: 'guser@gmail.com' });
    expect(stored.google_id).toBe('google-sub-123');
    expect(stored.is_email_verified).toBe(true);
  });

  it('dùng tên mặc định khi payload thiếu given_name/family_name', async () => {
    getVerifyIdToken().mockResolvedValue({
      getPayload: () => ({ sub: 'g-2', email: 'noname@gmail.com' })
    });
    const result = await authService.googleLogin('token');
    expect(result.user.first_name).toBe('Khách');
    expect(result.user.last_name).toBe('Hàng');
  });

  it('403 khi tài khoản Google đã bị khóa', async () => {
    await createUser({ email: 'guser@gmail.com', google_id: 'google-sub-123', deleted_at: new Date() });
    getVerifyIdToken().mockResolvedValue({ getPayload: () => payload });
    await expect(authService.googleLogin('token'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('401 khi verifyIdToken ném lỗi (token Google không hợp lệ)', async () => {
    getVerifyIdToken().mockRejectedValue(new Error('bad token'));
    await expect(authService.googleLogin('bad'))
      .rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('AuthService.generateAuthResponse', () => {
  it('sinh JWT chứa id + role và loại bỏ trường nhạy cảm', async () => {
    const user = await createUser({ role: 'MANAGER' });
    const { token, user: u } = authService.generateAuthResponse(user);
    expect(token).toBeTruthy();
    expect(u.password).toBeUndefined();
    expect(u.verify_token).toBeUndefined();
  });
});
