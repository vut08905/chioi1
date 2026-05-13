import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = [
  {
    name: 'short',
    ttl: 60_000,
    limit: 100,
  },
  {
    name: 'auth',
    ttl: 60_000,
    limit: 5,
  },
  {
    name: 'register',
    ttl: 60_000,
    limit: 3,
  },
  {
    name: 'otp',
    ttl: 30 * 60_000,
    limit: 3,
  },
];
