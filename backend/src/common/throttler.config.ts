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
    limit: 10, // 10 lần/phút/IP (cân bằng UX dev/test + chống brute force; nginx có thể thêm layer)
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
