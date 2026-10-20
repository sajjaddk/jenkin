const base = require('@playwright/test');

/** A valid booking payload. Override any field in a test. */
const newBooking = (overrides = {}) => ({
  firstname: 'Sajjad',
  lastname: 'Tester',
  totalprice: 150,
  depositpaid: true,
  bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
  additionalneeds: 'Breakfast',
  ...overrides,
});

exports.newBooking = newBooking;
exports.expect = base.expect;

exports.test = base.test.extend({
  /** Auth token for requests that change data. */
  token: async ({ request }, use) => {
    const res = await request.post('/auth', { data: { username: 'admin', password: 'password123' } });
    base.expect(res.status()).toBe(200);
    const { token } = await res.json();
    base.expect(token).toBeTruthy();
    await use(token);
  },

  /** A fresh booking created for the test and deleted afterwards, so tests stay independent. */
  booking: async ({ request, token }, use) => {
    const res = await request.post('/booking', { data: newBooking() });
    base.expect(res.status()).toBe(200);
    const created = await res.json(); // { bookingid, booking }
    await use(created);
    // Clean up. The test may already have deleted it, so the result is not asserted.
    await request.delete(`/booking/${created.bookingid}`, { headers: { Cookie: `token=${token}` } });
  },
});
