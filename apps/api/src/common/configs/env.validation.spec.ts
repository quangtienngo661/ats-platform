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
});
