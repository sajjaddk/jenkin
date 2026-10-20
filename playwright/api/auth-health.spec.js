const { test, expect } = require('./fixtures');

test.describe('Health and authentication', () => {
  test('health check responds (this API answers 201 to /ping)', async ({ request }) => {
    const res = await request.get('/ping');
    expect(res.status()).toBe(201);
  });

  test('valid credentials return a token', async ({ request }) => {
    const res = await request.post('/auth', { data: { username: 'admin', password: 'password123' } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token).toEqual(expect.any(String));
    expect(body.token.length).toBeGreaterThan(5);
  });

  const badLogins = [
    ['wrong password', { username: 'admin', password: 'wrong' }],
    ['wrong username', { username: 'nobody', password: 'password123' }],
    ['empty credentials', { username: '', password: '' }],
  ];
  for (const [name, data] of badLogins) {
    test(`refuses ${name}`, async ({ request }) => {
      const res = await request.post('/auth', { data });
      expect(res.status()).toBe(200); // this API reports failure in the body
      const body = await res.json();
      expect(body).not.toHaveProperty('token');
      expect(body.reason).toBe('Bad credentials');
    });
  }
});
