const { test, expect, newBooking } = require('./fixtures');

test.describe('Authorization (negative)', () => {
  test('PUT without a token is forbidden', async ({ request, booking }) => {
    const res = await request.put(`/booking/${booking.bookingid}`, { data: newBooking({ firstname: 'NoAuth' }) });
    expect(res.status()).toBe(403);
  });

  test('PUT with an invalid token is forbidden', async ({ request, booking }) => {
    const res = await request.put(`/booking/${booking.bookingid}`, {
      headers: { Cookie: 'token=not-a-real-token' },
      data: newBooking({ firstname: 'BadToken' }),
    });
    expect(res.status()).toBe(403);
  });

  test('PATCH without a token is forbidden', async ({ request, booking }) => {
    const res = await request.patch(`/booking/${booking.bookingid}`, { data: { firstname: 'NoAuth' } });
    expect(res.status()).toBe(403);
  });

  test('DELETE without a token is forbidden and the booking stays', async ({ request, booking }) => {
    const res = await request.delete(`/booking/${booking.bookingid}`);
    expect(res.status()).toBe(403);
    expect((await request.get(`/booking/${booking.bookingid}`)).status()).toBe(200);
  });

  test('an unauthorised update does not change the data', async ({ request, booking }) => {
    await request.put(`/booking/${booking.bookingid}`, { data: newBooking({ firstname: 'Hacker' }) });
    const current = await (await request.get(`/booking/${booking.bookingid}`)).json();
    expect(current.firstname).toBe(booking.booking.firstname);
  });
});

test.describe('Input validation (negative)', () => {
  // Known quirk: this public API answers 500 (not 400) for an invalid body.
  const invalidBodies = [
    ['empty body', {}],
    ['missing firstname', (() => { const b = newBooking(); delete b.firstname; return b; })()],
    ['missing bookingdates', (() => { const b = newBooking(); delete b.bookingdates; return b; })()],
    ['only one field', { firstname: 'Only' }],
  ];
  for (const [name, data] of invalidBodies) {
    test(`rejects a booking with ${name}`, async ({ request }) => {
      const res = await request.post('/booking', { data });
      expect([400, 500]).toContain(res.status());
    });
  }

  test('a rejected booking is not stored', async ({ request }) => {
    await request.post('/booking', { data: { firstname: 'Ghost' } });
    const filtered = await (await request.get('/booking', { params: { firstname: 'Ghost' } })).json();
    expect(filtered).toEqual([]);
  });

  test('special characters are stored as plain text', async ({ request, token }) => {
    const text = `<script>alert(1)</script> & "quotes" 'single'`;
    const res = await request.post('/booking', { data: newBooking({ additionalneeds: text }) });
    expect(res.status()).toBe(200);
    const created = await res.json();
    expect(created.booking.additionalneeds).toBe(text);
    await request.delete(`/booking/${created.bookingid}`, { headers: { Cookie: `token=${token}` } });
  });
});
