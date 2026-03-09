import { app } from './test/utils/server.test';
import Elysia, { t } from 'elysia';
import { pluginUnifyElysia } from './src/index.ts';

// Test params validation  
const paramsServer = new Elysia().use(pluginUnifyElysia()).get('/items/:id', ({ params }) => params, {
  params: t.Object({ id: t.Number() }),
});
const r3 = await paramsServer.handle(new Request('http://localhost/items/not-a-number'));
console.log('PARAMS VAL status:', r3.status);
const body3 = await r3.text();
console.log('PARAMS VAL body:', body3);
const parsed3 = JSON.parse(body3);
console.log('PARAMS VAL error:', parsed3.error, '| Has code field:', 'code' in parsed3);
