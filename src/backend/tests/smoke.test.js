import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../app.js';

describe('smoke', () => {
  it('connects to in-memory mongo', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  it('serves the root route', async () => {
    const res = await request(createApp()).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Optics Management API');
  });
});
