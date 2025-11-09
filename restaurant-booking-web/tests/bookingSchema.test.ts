import assert from 'node:assert/strict';
import { bookingSchema } from '../src/utils/validators';

export async function run(): Promise<void> {
  const validResult = bookingSchema.safeParse({
    date: '2024-11-07',
    time: '19:30',
    partySize: 4,
    specialRequests: 'Window seat'
  });

  assert.equal(validResult.success, true, 'expected valid payload to pass');
  if (!validResult.success) {
    throw new Error('Expected payload to be valid');
  }
  assert.equal(validResult.data.partySize, 4);

  const invalidResult = bookingSchema.safeParse({
    date: '',
    time: '',
    partySize: 0
  });

  assert.equal(invalidResult.success, false, 'expected invalid payload to fail');
  if (invalidResult.success) {
    throw new Error('Expected payload to be invalid');
  }

  const messages = invalidResult.error.issues.map((issue) => issue.message);
  assert.deepEqual(messages, [
    'Date is required',
    'Time is required',
    'Number must be greater than or equal to 1'
  ]);
}
