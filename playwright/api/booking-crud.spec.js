const { test, expect, newBooking } = require('./fixtures');

const MAX_MS = 3000;

test.describe('Booking: create and read', () => {
  test('creates a booking and returns it with an id', async ({ request }) => {
    const started = Date.now();
    const res = await request.post('/booking', { data: newBooking({ firstname: 'Create', lastname: 'Check' }) });
    expect(Date.now() - started).toBeLessThan(MAX_MS);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.bookingid).toEqual(expect.any(Number));
    expect(body.booking).toMatchObject({
      firstname: 'Create',
      lastname: 'Check',
      totalprice: 150,
      depositpaid: true,
      bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
      additionalneeds: 'Breakfast',
    });

    // clean up (the booking fixture is not used here)
    const auth = await request.post('/auth', { data: { username: 'admin', password: 'password123' } });
    const { token } = await auth.json();
    await request.delete(`/booking/${body.bookingid}`, { headers: { Cookie: `token=${token}` } });
  });

  test('gets a booking by id with the expected fields', async ({ request, booking }) => {
    const res = await request.get(`/booking/${booking.bookingid}`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/json');
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(
      ['additionalneeds', 'bookingdates', 'depositpaid', 'firstname', 'lastname', 'totalprice'].sort()
    );
    expect(body).toMatchObject(booking.booking);
  });

  test('lists bookings and includes the new one', async ({ request, booking }) => {
    const res = await request.get('/booking');
    expect(res.status()).toBe(200);
    const list = await res.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.map((b) => b.bookingid)).toContain(booking.bookingid);
  });

  test('filters bookings by first and last name', async ({ request, booking }) => {
    const res = await request.get('/booking', { params: { firstname: 'Sajjad', lastname: 'Tester' } });
    expect(res.status()).toBe(200);
    const ids = (await res.json()).map((b) => b.bookingid);
    expect(ids).toContain(booking.bookingid);
  });

  test('an unknown id returns 404', async ({ request }) => {
    const res = await request.get('/booking/999999999');
    expect(res.status()).toBe(404);
  });
});

test.describe('Booking: update', () => {
  test('PUT replaces the whole booking (token in cookie)', async ({ request, booking, token }) => {
    const res = await request.put(`/booking/${booking.bookingid}`, {
      headers: { Cookie: `token=${token}` },
      data: newBooking({ firstname: 'Updated', lastname: 'Name', totalprice: 999, depositpaid: false }),
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ firstname: 'Updated', lastname: 'Name', totalprice: 999, depositpaid: false });

    const check = await (await request.get(`/booking/${booking.bookingid}`)).json();
    expect(check.firstname).toBe('Updated');
  });

  test('PUT also works with Basic authorization', async ({ request, booking }) => {
    const res = await request.put(`/booking/${booking.bookingid}`, {
      headers: { Authorization: 'Basic ' + Buffer.from('admin:password123').toString('base64') },
      data: newBooking({ firstname: 'BasicAuth' }),
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).firstname).toBe('BasicAuth');
  });

  test('PATCH changes only the fields sent', async ({ request, booking, token }) => {
    const res = await request.patch(`/booking/${booking.bookingid}`, {
      headers: { Cookie: `token=${token}` },
      data: { firstname: 'Patched', totalprice: 321 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.firstname).toBe('Patched');
    expect(body.totalprice).toBe(321);
    expect(body.lastname).toBe(booking.booking.lastname); // untouched
    expect(body.additionalneeds).toBe(booking.booking.additionalneeds); // untouched
  });
});

test.describe('Booking: delete', () => {
  test('deleting removes the booking', async ({ request, booking, token }) => {
    const del = await request.delete(`/booking/${booking.bookingid}`, { headers: { Cookie: `token=${token}` } });
    expect(del.status()).toBe(201); // this API answers 201 Created for a delete

    const after = await request.get(`/booking/${booking.bookingid}`);
    expect(after.status()).toBe(404);

    const list = await (await request.get('/booking')).json();
    expect(list.map((b) => b.bookingid)).not.toContain(booking.bookingid);
  });

  test('deleting the same booking twice is rejected', async ({ request, booking, token }) => {
    const headers = { Cookie: `token=${token}` };
    await request.delete(`/booking/${booking.bookingid}`, { headers });
    const again = await request.delete(`/booking/${booking.bookingid}`, { headers });
    expect(again.status()).toBe(405); // this API's answer for a booking that no longer exists
  });
});
