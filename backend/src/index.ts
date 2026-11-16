export { FleetService } from './domain/fleet-service.ts';
export type { FleetDeps, RecordTripInput, CorrectionInput } from './domain/fleet-service.ts';
export { DomainError } from './domain/errors.ts';
export type { ErrorCode } from './domain/errors.ts';
export { money, CURRENCY } from './domain/money.ts';
export type { Money } from './domain/money.ts';
export { operatingDate, systemClock } from './domain/time.ts';
export type { Clock, IdGenerator } from './domain/time.ts';
export * from './domain/types.ts'; // يشمل Page وListOptions
