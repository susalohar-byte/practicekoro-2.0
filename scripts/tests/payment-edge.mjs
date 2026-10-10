/* global Request */
// Actual Edge handlers transpiled into an isolated harness; every dependency is mocked.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as validation from '../../supabase/functions/_shared/payment-validation.ts';
async function handler(name, state) {
  const source = await readFile(`supabase/functions/${name}/index.ts`, 'utf8');
  const code = ts
    .transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    })
    .outputText.replace(/^import[\s\S]*?;\n/gm, '');
  let serve;
  const env = {
    SUPABASE_URL: 'https://test.invalid',
    SUPABASE_ANON_KEY: 'anon',
    SUPABASE_SERVICE_ROLE_KEY: 'service',
    RAZORPAY_KEY_SECRET: 'secret',
    RAZORPAY_KEY_ID: 'key',
    RAZORPAY_WEBHOOK_SECRET: 'webhook',
  };
  const service = {
    auth: {
      getUser: async () => ({
        data: { user: state.unauthorized ? null : { id: 'u' } },
        error: null,
      }),
    },
    from: (table) => {
      const query = {
        select: () => query,
        eq: () => query,
        insert: () => query,
        maybeSingle: async () =>
          table === 'payment_gateways'
            ? { data: state.gateway, error: state.gatewayError || null }
            : { data: state.payment, error: null },
        single: async () =>
          table === 'subscription_plans'
            ? {
                data: { id: 'plan', price: 100, currency: 'INR', is_active: true, title: 'Pro' },
                error: null,
              }
            : {
                data: state.insertFail ? null : { id: 'saved' },
                error: state.insertFail ? { message: 'denied' } : null,
              },
      };
      return query;
    },
    rpc: async (name, args) => {
      state.calls.push({ name, args });
      return { data: { success: true, subscription_id: 's', status: 'active' }, error: null };
    },
  };
  const fetch = async () => {
    state.fetches++;
    return { ok: true, json: async () => state.provider };
  };
  new Function(
    'Deno',
    'createClient',
    'fetch',
    'verifyHmacSha256',
    'buildPaymentSignaturePayload',
    'paiseToRupees',
    ...Object.keys(validation),
    code.replace(/^export \{\};?\n?/gm, '')
  )(
    {
      env: { get: (k) => env[k] },
      serve: (f) => {
        serve = f;
      },
    },
    () => service,
    fetch,
    async () => state.signatureValid !== false,
    (o, p) => `${o}|${p}`,
    (a) => a / 100,
    ...Object.values(validation)
  );
  return serve;
}
const state = () => ({
  gateway: { key_id: 'key', is_active: true },
  calls: [],
  fetches: 0,
  payment: { id: 'row', user_id: 'u', plan_id: 'plan', amount: 100, currency: 'INR' },
  provider: {
    id: 'pay_1',
    order_id: 'order_1',
    status: 'captured',
    amount: 10000,
    currency: 'INR',
  },
});
const req = (body) =>
  new Request('https://test.invalid', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer fixture',
      'x-razorpay-signature': 'fixture',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
for (const name of ['create-razorpay-order', 'verify-payment']) {
  const s = state(),
    run = await handler(name, s);
  for (const body of [null, [], true, 'text', {}, { planId: {} }])
    assert.equal((await run(req(body))).status, 400, `${name}: ${JSON.stringify(body)}`);
  assert.equal(s.calls.length, 0);
  assert.equal(s.fetches, 0);
}
const payload = { orderId: 'order_1', paymentId: 'pay_1', signature: 'proof', planId: 'plan' };
for (const change of [
  { signatureValid: false },
  { payment: null },
  { payment: { plan_id: 'other' } },
  {
    provider: {
      id: 'pay_1',
      order_id: 'other',
      status: 'captured',
      amount: 10000,
      currency: 'INR',
    },
  },
  {
    provider: {
      id: 'pay_1',
      order_id: 'order_1',
      status: 'authorized',
      amount: 10000,
      currency: 'INR',
    },
  },
  {
    provider: { id: 'pay_1', order_id: 'order_1', status: 'captured', amount: 1, currency: 'INR' },
  },
]) {
  const s = Object.assign(state(), change),
    run = await handler('verify-payment', s);
  assert.notEqual((await run(req(payload))).status, 200);
  assert.equal(s.calls.length, 0);
}
{
  const s = state(),
    run = await handler('verify-payment', s);
  assert.equal((await run(req(payload))).status, 200);
  assert.equal(s.calls[0].name, 'activate_verified_razorpay_payment');
  assert.equal(s.calls[0].args.p_user_id, 'u');
}
for (const status of ['pending', 'failed']) {
  const s = state(),
    run = await handler('razorpay-webhook', s);
  assert.equal(
    (
      await run(
        req({
          event: 'refund.created',
          payload: { refund: { entity: { status, payment_id: 'pay_1', id: 'r', amount: 100 } } },
        })
      )
    ).status,
    200
  );
  assert.equal(s.calls.length, 0);
}
{
  const s = state(),
    run = await handler('razorpay-webhook', s);
  assert.equal(
    (
      await run(
        req({
          event: 'refund.processed',
          payload: {
            refund: { entity: { status: 'processed', payment_id: 'pay_1', id: 'r', amount: 100 } },
          },
        })
      )
    ).status,
    200
  );
  assert.equal(s.calls[0].name, 'reconcile_razorpay_refund');
  assert.equal((await run(req(null))).status, 400);
}
{
  const s = state();
  s.insertFail = true;
  s.provider = { id: 'order_1', amount: 10000, currency: 'INR' };
  const run = await handler('create-razorpay-order', s);
  assert.equal((await run(req({ planId: 'plan' }))).status, 500);
}
console.log(
  'PASS: actual payment Edge handlers reject invalid bodies/proof/ownership/capture/amount, process only final refunds, and stop checkout on failed persistence.'
);

{
  const s = state(),
    run = await handler('create-razorpay-order', s);
  assert.equal((await run(req({ planId: 'plan', couponCode: 'SAVE50' }))).status, 400);
  assert.equal(s.fetches, 0);
}

for (const change of [
  { gateway: { key_id: 'key', is_active: false } },
  { gateway: null },
  { gatewayError: { message: 'connection unavailable' } },
  { gateway: { key_id: 'other', is_active: true } },
  { gateway: { key_id: 'key', is_active: 'true' } },
]) {
  const s = Object.assign(state(), change),
    run = await handler('create-razorpay-order', s);
  assert.equal((await run(req({ planId: 'plan' }))).status, 503);
  assert.equal(s.fetches, 0, 'Disabled/unconfirmed gateway must never call provider');
}
console.log(
  'Gateway settings: disabled, absent, read failure, key mismatch and malformed switch passed'
);
