import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildApi } from '../src/http/app.ts';
import { FleetService } from '../src/domain/fleet-service.ts';

const TOKEN='test-token-that-is-at-least-32-characters-long';
const OWNER='captain-test';
function make() {
 let n=0;
 const service=new FleetService({clock:{now:()=>new Date('2026-11-20T07:00:00Z')},ids:{next:()=>String(++n)}});
 const app=buildApi({token:TOKEN,ownerUserId:OWNER,service});
 return {app,service};
}
const auth={authorization:'Bearer '+TOKEN};
const key='idempotency-key-0000001';

describe('Fastify API — development single-captain boundary',()=>{
 it('rejects missing and invalid auth, health is public',async()=>{
  const {app}=make();
  assert.equal((await app.inject({method:'GET',url:'/health'})).statusCode,200);
  assert.equal((await app.inject({method:'GET',url:'/api/vehicles'})).statusCode,401);
  assert.equal((await app.inject({method:'GET',url:'/api/vehicles',headers:{authorization:'Bearer bad'}})).statusCode,401);
  await app.close();
 });
 it('fails closed when no strong token is configured',()=>{
  assert.throws(()=>buildApi({token:'short',ownerUserId:OWNER}),/at least 32/);
  assert.throws(()=>buildApi({token:'x'.repeat(32),ownerUserId:''}),/FC_OWNER_ID/);
 });
 it('registers vehicle and starts, ends and cancels shifts through API',async()=>{
  const {app}=make();
  const v=await app.inject({method:'POST',url:'/api/vehicles',headers:{...auth,'idempotency-key':key},payload:{label:'Test car'}});
  assert.equal(v.statusCode,201);
  const vehicle=v.json();
  const start=await app.inject({method:'POST',url:'/api/shifts',headers:{...auth,'idempotency-key':'shift-start-key-0001'},payload:{vehicleId:vehicle.id,startOdometerKm:100}});
  assert.equal(start.statusCode,201);
  const shift=start.json();
  const trips=await app.inject({method:'GET',url:'/api/shifts/'+shift.id+'/trips',headers:auth});
  assert.equal(trips.statusCode,200);
  const end=await app.inject({method:'POST',url:'/api/shifts/'+shift.id+'/end',headers:{...auth,'idempotency-key':'shift-end-key-00001'},payload:{endOdometerKm:120}});
  assert.equal(end.statusCode,200);
  assert.equal(end.json().status,'CLOSED');
  await app.close();
 });
 it('requires Idempotency-Key and rejects real foreign-owned resources (hidden 404)',async()=>{
  const {app,service}=make();
  const v=service.registerVehicle(OWNER,'Car');
  const shift=service.startShift({ownerUserId:OWNER,vehicleId:v.id,startOdometerKm:0});
  const missing=await app.inject({method:'POST',url:'/api/shifts/'+shift.id+'/end',headers:auth,payload:{endOdometerKm:10}});
  assert.equal(missing.statusCode,422);

  const foreignVehicle=service.registerVehicle('other-captain','Foreign car');
  const foreignShift=service.startShift({ownerUserId:'other-captain',vehicleId:foreignVehicle.id,startOdometerKm:50});
  const foreignRead=await app.inject({method:'GET',url:'/api/shifts/'+foreignShift.id+'/trips',headers:auth});
  assert.equal(foreignRead.statusCode,404);
  const foreignMutation=await app.inject({
   method:'POST',
   url:'/api/shifts/'+foreignShift.id+'/end',
   headers:{...auth,'idempotency-key':'foreign-shift-end-0001'},
   payload:{endOdometerKm:60}
  });
  assert.equal(foreignMutation.statusCode,404);
  assert.equal(service.listShifts('other-captain').items[0].status,'OPEN');
  await app.close();
 });
 it('records a trip and replays idempotently',async()=>{
  const {app}=make();
  const v=await app.inject({method:'POST',url:'/api/vehicles',headers:{...auth,'idempotency-key':'vehicle-key-0000001'},payload:{label:'Car'}});
  const s=await app.inject({method:'POST',url:'/api/shifts',headers:{...auth,'idempotency-key':'shift-start-key-0001'},payload:{vehicleId:v.json().id,startOdometerKm:0}});
  const first=await app.inject({method:'POST',url:'/api/trips',headers:{...auth,'idempotency-key':'trip-record-key-00001'},payload:{shiftId:s.json().id,platform:'uber',occurredAt:'2026-11-20T07:00:00Z',fareMinor:100}});
  assert.equal(first.statusCode,201);
  const replay=await app.inject({method:'POST',url:'/api/trips',headers:{...auth,'idempotency-key':'trip-record-key-00001'},payload:{shiftId:s.json().id,platform:'uber',occurredAt:'2026-11-20T07:00:00Z',fareMinor:100}});
  assert.equal(replay.statusCode,200);
  assert.equal(replay.json().replayed,true);
  await app.close();
 });
 it('sets request id and safely returns invalid body errors',async()=>{
  const {app}=make();
  const res=await app.inject({method:'POST',url:'/api/vehicles',headers:{...auth,'idempotency-key':key},payload:{label:''}});
  assert.equal(res.statusCode,422);
  assert.ok(res.headers['x-request-id']);
  await app.close();
 });
});
