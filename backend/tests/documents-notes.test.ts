import { existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/lib/redis.js';

const email = `documents-notes-test-${Date.now()}@example.com`;
const password = 'SecurePass123!';
let token = '';
let documentId = '';
let documentPath = '';

describe('documents and notes modules', () => {
  beforeAll(async () => {
    if (redis.status === 'end' || redis.status === 'wait') await redis.connect();
    await request(app).post('/api/auth/register').send({ fullName: 'Documents Notes Test', email, password });
    token = (await request(app).post('/api/auth/login').send({ email, password })).body.data.accessToken;
  });

  afterAll(async () => {
    if (documentPath && existsSync(documentPath)) await unlink(documentPath);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) { await prisma.activityLog.deleteMany({ where: { userId: user.id } }); await prisma.user.delete({ where: { id: user.id } }); }
    await redis.quit();
    await prisma.$disconnect();
  });

  it('uploads, filters, updates, downloads and deletes a document', async () => {
    const uploaded = await request(app).post('/api/documents/upload').set('Authorization', `Bearer ${token}`).field('title', 'Lecture PDF').field('tags', 'backend, important').attach('file', Buffer.from('%PDF-1.4 sample'), { filename: 'lecture.pdf', contentType: 'application/pdf' });
    expect(uploaded.status).toBe(201);
    documentId = uploaded.body.data.id;
    documentPath = join(process.cwd(), 'uploads', uploaded.body.data.fileUrl.replace('/uploads/', ''));
    expect(uploaded.body.data).toMatchObject({ title: 'Lecture PDF', fileType: 'pdf', storageProvider: 'local', tags: ['backend', 'important'] });
    expect(existsSync(documentPath)).toBe(true);

    const list = await request(app).get('/api/documents?tag=backend&search=lecture').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items).toHaveLength(1);
    const updated = await request(app).patch(`/api/documents/${documentId}`).set('Authorization', `Bearer ${token}`).send({ title: 'Updated PDF', tags: ['final'] });
    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe('Updated PDF');
    const download = await request(app).get(`/api/documents/${documentId}/download`).set('Authorization', `Bearer ${token}`).redirects(0);
    expect(download.status).toBe(302);
    const removed = await request(app).delete(`/api/documents/${documentId}`).set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(200);
    expect(existsSync(documentPath)).toBe(false);
    documentPath = '';
  });

  it('rejects dangerous MIME types and sanitizes rich text notes', async () => {
    const blocked = await request(app).post('/api/documents/upload').set('Authorization', `Bearer ${token}`).attach('file', Buffer.from('<script>alert(1)</script>'), { filename: 'evil.html', contentType: 'text/html' });
    expect(blocked.status).toBe(422);
    const created = await request(app).post('/api/notes').set('Authorization', `Bearer ${token}`).send({ title: 'Safe note', contentRichText: '<p>Hello</p><script>alert(1)</script><a href="javascript:alert(2)">bad</a>' });
    expect(created.status).toBe(201);
    expect(created.body.data.contentRichText).toContain('<p>Hello</p>');
    expect(created.body.data.contentRichText).not.toContain('<script>');
    expect(created.body.data.contentRichText).not.toContain('javascript:');
    const pinned = await request(app).patch(`/api/notes/${created.body.data.id}/pin`).set('Authorization', `Bearer ${token}`).send({});
    expect(pinned.body.data.isPinned).toBe(true);
    const removed = await request(app).delete(`/api/notes/${created.body.data.id}`).set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(200);
  });
});
