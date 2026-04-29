import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * app.config.ts 의 EAS_BUILD_PROFILE 분기 검증.
 *
 * 동일 모듈을 profile 별로 다르게 평가해야 하므로 각 케이스마다 process.env 변경 + vi.resetModules() 로
 * 캐시를 비우고 dynamic import 한다 — eas config 같은 외부 호출 / 인증 없이 ATS 결과만 정적으로 captures.
 *
 * 보호 대상: production 빌드가 실수로 ATS 우회/cleartext 를 다시 켜지 않도록.
 */

interface IosConfig {
  infoPlist?: {
    NSAppTransportSecurity?: {
      NSAllowsArbitraryLoads?: boolean;
      NSAllowsArbitraryLoadsForMedia?: boolean;
      NSExceptionDomains?: Record<string, { NSExceptionAllowsInsecureHTTPLoads?: boolean }>;
    };
  };
}
interface AndroidConfig {
  usesCleartextTraffic?: boolean;
}
interface ResolvedConfig {
  ios?: IosConfig;
  android?: AndroidConfig;
  extra?: { buildProfile?: string };
}

async function loadConfig(profile: 'development' | 'preview' | 'production'): Promise<ResolvedConfig> {
  process.env.EAS_BUILD_PROFILE = profile;
  vi.resetModules();
  const mod = await import('./app.config');
  return mod.default as ResolvedConfig;
}

describe('app.config.ts · EAS_BUILD_PROFILE ATS 분기', () => {
  beforeEach(() => {
    delete process.env.EAS_BUILD_PROFILE;
  });

  it('production: 모든 ATS 예외 제거 + Android cleartext 차단', async () => {
    const c = await loadConfig('production');
    const ats = c.ios?.infoPlist?.NSAppTransportSecurity;
    expect(ats?.NSAllowsArbitraryLoads).toBe(false);
    expect(ats?.NSAllowsArbitraryLoadsForMedia).toBeUndefined();
    expect(ats?.NSExceptionDomains).toBeUndefined();
    expect(c.android?.usesCleartextTraffic).toBe(false);
    expect(c.extra?.buildProfile).toBe('production');
  });

  it('preview: 미디어 ATS 만 우회 (CDN/Unsplash http 폴백 호환) + localhost 예외 유지', async () => {
    const c = await loadConfig('preview');
    const ats = c.ios?.infoPlist?.NSAppTransportSecurity;
    expect(ats?.NSAllowsArbitraryLoads).toBe(false);
    expect(ats?.NSAllowsArbitraryLoadsForMedia).toBe(true);
    expect(ats?.NSExceptionDomains?.localhost?.NSExceptionAllowsInsecureHTTPLoads).toBe(true);
    // production 의 cleartext 차단은 적용되지 않음
    expect(c.android?.usesCleartextTraffic).toBeUndefined();
  });

  it('development: localhost + 10.0.2.2 (Android emulator) 예외 — 미디어 우회 X', async () => {
    const c = await loadConfig('development');
    const ats = c.ios?.infoPlist?.NSAppTransportSecurity;
    expect(ats?.NSAllowsArbitraryLoads).toBe(false);
    expect(ats?.NSAllowsArbitraryLoadsForMedia).toBeUndefined();
    expect(ats?.NSExceptionDomains?.localhost?.NSExceptionAllowsInsecureHTTPLoads).toBe(true);
    expect(ats?.NSExceptionDomains?.['10.0.2.2']?.NSExceptionAllowsInsecureHTTPLoads).toBe(true);
  });

  it('EAS_BUILD_PROFILE 미설정 시 development 로 폴백', async () => {
    delete process.env.EAS_BUILD_PROFILE;
    vi.resetModules();
    const mod = await import('./app.config');
    const c = mod.default as ResolvedConfig;
    expect(c.extra?.buildProfile).toBe('development');
  });
});
