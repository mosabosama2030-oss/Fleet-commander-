import Fastify, { type FastifyInstance } from 'fastify';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { FleetService } from '../domain/fleet-service.ts';
import { validation } from '../domain/errors.ts';
import { systemClock } from '../domain/time.ts';
import { errorResponse, idempotencyKeyFrom, listOptionsFrom, toWirePage, wireErrorResponse } from './wire.ts';

export interface ApiOptions {
  readonly token: string;
  readonly ownerUserId: string;
  readonly service?: FleetService;
}

function safeTokenEqual(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a, b);
}

function objectBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw validation('body must be an object');
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw validation(field + ' is required');
  return value.trim();
}

function requiredNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw validation(field + ' must be a non-negative integer');
  return value;
}

function mapPage<T>(page: { items: readonly T[]; nextCursor: string | null }) {
  return toWirePage(page, (item) => item);
}

export function buildApi(options: ApiOptions): FastifyInstance {
  if (!options.token || options.token.length < 32) throw new Error('FC_AUTH_TOKEN must be configured and at least 32 characters');
  if (!options.ownerUserId || options.ownerUserId.trim() === '') throw new Error('FC_OWNER_ID must be configured');
  const app = Fastify({ logger: false, bodyLimit: 32 * 1024 });
  const service = options.service ?? new FleetService({ clock: systemClock, ids: { next: randomUUID } });
  const owner = options.ownerUserId;

  app.addHook('onRequest', async (request, reply) => {
    const requestId = randomUUID();
    request.headers['x-request-id'] = requestId;
    reply.header('x-request-id', requestId);
  });

  app.get('/health', async () => ({ status: 'ok', storage: 'memory-ephemeral', mode: 'single-captain-development' }));

  app.addHook('preHandler', async (request, reply) => {
    if (request.url === '/health') return;
    const header = request.headers.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      reply.code(401).send(wireErrorResponse('UNAUTHENTICATED', 'Authentication required', String(request.headers['x-request-id'])).body);
      return;
    }
    const supplied = header.slice(7);
    if (!safeTokenEqual(options.token, supplied)) {
      reply.code(401).send(wireErrorResponse('UNAUTHENTICATED', 'Authentication required', String(request.headers['x-request-id'])).body);
    }
  });

  app.setErrorHandler((err, request, reply) => {
    const id = String(request.headers['x-request-id'] ?? randomUUID());
    const response = errorResponse(err, id);
    reply.code(response.status).send(response.body);
  });

  app.post('/api/vehicles', async (request, reply) => {
    const body = objectBody(request.body);
    const key = idempotencyKeyFrom(request.headers);
    const vehicle = service.registerVehicle(owner, requiredString(body.label, 'label'), key);
    return reply.code(201).send(vehicle);
  });
  app.get('/api/vehicles', async (request) => mapPage(service.listVehicles(owner, listOptionsFrom(request.query as Record<string, unknown>))));

  app.post('/api/shifts', async (request, reply) => {
    const body = objectBody(request.body);
    const shift = service.startShift({
      ownerUserId: owner,
      vehicleId: requiredString(body.vehicleId, 'vehicleId'),
      startOdometerKm: requiredNumber(body.startOdometerKm, 'startOdometerKm'),
      idempotencyKey: idempotencyKeyFrom(request.headers),
    });
    return reply.code(201).send(shift);
  });
  app.get('/api/shifts', async (request) => mapPage(service.listShifts(owner, listOptionsFrom(request.query as Record<string, unknown>))));
  app.post('/api/shifts/:id/end', async (request, reply) => {
    const body = objectBody(request.body);
    return reply.send(service.endShift({
      ownerUserId: owner, shiftId: requiredString((request.params as {id:string}).id, 'shiftId'),
      endOdometerKm: requiredNumber(body.endOdometerKm, 'endOdometerKm'), idempotencyKey: idempotencyKeyFrom(request.headers)
    }));
  });
  app.post('/api/shifts/:id/cancel', async (request) => {
    const body = objectBody(request.body);
    return service.cancelShift({
      ownerUserId: owner, shiftId: requiredString((request.params as {id:string}).id, 'shiftId'),
      reason: requiredString(body.reason, 'reason'), idempotencyKey: idempotencyKeyFrom(request.headers)
    });
  });

  app.get('/api/shifts/:id/trips', async (request) => {
    const params=request.params as {id:string};
    return mapPage(service.listTrips(owner, requiredString(params.id,'shiftId'), listOptionsFrom(request.query as Record<string,unknown>)));
  });
  app.post('/api/trips', async (request, reply) => {
    const body=objectBody(request.body);
    const result=service.recordTrip({
      ownerUserId:owner, shiftId:requiredString(body.shiftId,'shiftId'), platform:requiredString(body.platform,'platform'),
      occurredAt:requiredString(body.occurredAt,'occurredAt'), fareMinor:requiredNumber(body.fareMinor,'fareMinor'),
      idempotencyKey:idempotencyKeyFrom(request.headers)
    });
    return reply.code(result.replayed ? 200 : 201).send(result);
  });
  app.post('/api/trips/:id/void', async (request) => {
    const body=objectBody(request.body);
    return service.voidTrip({
      ownerUserId:owner, tripId:requiredString((request.params as {id:string}).id,'tripId'),
      reason:requiredString(body.reason,'reason'), idempotencyKey:idempotencyKeyFrom(request.headers)
    });
  });
  app.post('/api/shifts/:id/corrections', async (request, reply) => {
    const body=objectBody(request.body);
    const field=requiredString(body.field,'field');
    const accepted=['trip.fare_minor','trip.status','shift.start_odometer_km','shift.end_odometer_km'];
    if(!accepted.includes(field)) throw validation('unsupported correction field');
    const newValue=typeof body.newValue==='string' ? body.newValue : requiredNumber(body.newValue,'newValue');
    return reply.code(201).send(service.correct({
      ownerUserId:owner, shiftId:requiredString((request.params as {id:string}).id,'shiftId'),
      field:field as never, entityId:typeof body.entityId==='string'?body.entityId:undefined,
      newValue, reason:requiredString(body.reason,'reason'), idempotencyKey:idempotencyKeyFrom(request.headers)
    }));
  });

  return app;
}
