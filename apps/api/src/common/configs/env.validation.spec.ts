import { validate } from './env.validation';

describe('env validation — AI provider', () => {
  const baseEnv = {
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    JWT_SECRET: 'a-secret-with-at-least-16-chars',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
    CLIENT_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
  };

  it('control: a complete gemini env passes', () => {
    const env = { ...baseEnv, GOOGLE_API_KEY: 'g' };

    expect(validate(env)).toBe(env);
  });

  it('gemini without GOOGLE_API_KEY fails and names GOOGLE_API_KEY', () => {
    expect(() => validate({ ...baseEnv, AI_PROVIDER: 'gemini' })).toThrow(
      /GOOGLE_API_KEY/,
    );
  });

  it('an unset AI_PROVIDER defaults to gemini, so GOOGLE_API_KEY is required', () => {
    expect(() => validate({ ...baseEnv })).toThrow(/GOOGLE_API_KEY/);
  });

  it('openai without OPENAI_API_KEY fails and names OPENAI_API_KEY', () => {
    const env = { ...baseEnv, AI_PROVIDER: 'openai', GOOGLE_API_KEY: 'g' };

    expect(() => validate(env)).toThrow(/OPENAI_API_KEY/);
  });

  it('openai with OPENAI_API_KEY passes without GOOGLE_API_KEY', () => {
    const env = { ...baseEnv, AI_PROVIDER: 'openai', OPENAI_API_KEY: 'o' };

    expect(validate(env)).toBe(env);
  });

  it('gemini without OPENAI_API_KEY passes', () => {
    const env = { ...baseEnv, AI_PROVIDER: 'gemini', GOOGLE_API_KEY: 'g' };

    expect(validate(env)).toBe(env);
  });

  it('AI_PROVIDER=abc fails and names AI_PROVIDER', () => {
    const env = { ...baseEnv, AI_PROVIDER: 'abc', GOOGLE_API_KEY: 'g' };

    expect(() => validate(env)).toThrow(/AI_PROVIDER/);
  });

  it('OPENAI_MODEL_PRO and OPENAI_MODEL_FLASH are optional', () => {
    const without = { ...baseEnv, AI_PROVIDER: 'openai', OPENAI_API_KEY: 'o' };
    const withModels = {
      ...without,
      OPENAI_MODEL_PRO: 'x',
      OPENAI_MODEL_FLASH: 'y',
    };

    expect(validate(without)).toBe(without);
    expect(validate(withModels)).toBe(withModels);
  });

  describe('SKILL_MATCH_THRESHOLD', () => {
    const geminiEnv = { ...baseEnv, GOOGLE_API_KEY: 'g' };

    it('is optional', () => {
      expect(validate(geminiEnv)).toBe(geminiEnv);
    });

    it.each(['0', '0.8', '0.75', '1', '1.0'])('accepts %s', (value) => {
      const env = { ...geminiEnv, SKILL_MATCH_THRESHOLD: value };

      expect(validate(env)).toBe(env);
    });

    it.each(['abc', '1.5', '-0.1', '2', '0.8.1', ''])(
      'rejects %p and names SKILL_MATCH_THRESHOLD',
      (value) => {
        expect(() =>
          validate({ ...geminiEnv, SKILL_MATCH_THRESHOLD: value }),
        ).toThrow(/SKILL_MATCH_THRESHOLD/);
      },
    );
  });

  describe('ANCHOR_COUNT', () => {
    const geminiEnv = { ...baseEnv, GOOGLE_API_KEY: 'g' };

    it('is optional', () => {
      expect(validate(geminiEnv)).toBe(geminiEnv);
    });

    it.each(['1', '3', '10'])('accepts %s', (value) => {
      const env = { ...geminiEnv, ANCHOR_COUNT: value };

      expect(validate(env)).toBe(env);
    });

    it.each(['0', '11', '-1', '2.5', 'abc', ''])(
      'rejects %p and names ANCHOR_COUNT',
      (value) => {
        expect(() => validate({ ...geminiEnv, ANCHOR_COUNT: value })).toThrow(
          /ANCHOR_COUNT/,
        );
      },
    );
  });

  describe('LiveKit (GĐ4 R5)', () => {
    const geminiEnv = { ...baseEnv, GOOGLE_API_KEY: 'g' };
    const livekit = {
      LIVEKIT_API_KEY: 'devkey',
      LIVEKIT_API_SECRET: 'secret',
      LIVEKIT_PUBLIC_URL: 'ws://localhost:7880',
    };

    it('is optional as a whole: the API boots without an interview room', () => {
      expect(validate(geminiEnv)).toBe(geminiEnv);
    });

    it.each(['ws://localhost:7880', 'wss://rtc.example.com', 'https://rtc.example.com'])(
      'accepts the public url %s',
      (url) => {
        const env = { ...geminiEnv, ...livekit, LIVEKIT_PUBLIC_URL: url };

        expect(validate(env)).toBe(env);
      },
    );

    it.each(['localhost:7880', 'ftp://rtc.example.com', ''])(
      'rejects the public url %p and names LIVEKIT_PUBLIC_URL',
      (url) => {
        expect(() =>
          validate({ ...geminiEnv, ...livekit, LIVEKIT_PUBLIC_URL: url }),
        ).toThrow(/LIVEKIT_PUBLIC_URL/);
      },
    );

    it.each(['LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET', 'LIVEKIT_PUBLIC_URL'])(
      'a partial setup without %s fails and names it',
      (missing) => {
        const env: Record<string, string> = { ...geminiEnv, ...livekit };
        delete env[missing];

        expect(() => validate(env)).toThrow(new RegExp(missing));
      },
    );
  });
});
