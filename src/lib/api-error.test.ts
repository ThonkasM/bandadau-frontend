import { ApiError, isApiErrorWithCode } from './api-error';

const problem = {
  type: 'https://api.bandadau.com/problems/event-full',
  title: 'Evento lleno',
  status: 422,
  code: 'EVENT_FULL',
  detail: 'No quedan cupos.',
  traceId: 'tr-1',
};

describe('ApiError', () => {
  it('parses a Problem Details body', () => {
    const error = ApiError.fromUnknown(422, problem);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.code).toBe('EVENT_FULL');
    expect(error.detail).toBe('No quedan cupos.');
    expect(error.traceId).toBe('tr-1');
  });

  it('falls back to INTERNAL_ERROR for non-problem bodies', () => {
    const error = ApiError.fromUnknown(500, 'boom');
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.status).toBe(500);
  });

  it('matches by code', () => {
    const error = ApiError.fromUnknown(422, problem);
    expect(isApiErrorWithCode(error, 'EVENT_FULL')).toBe(true);
    expect(isApiErrorWithCode(error, 'OTHER')).toBe(false);
    expect(isApiErrorWithCode(new Error('x'), 'EVENT_FULL')).toBe(false);
  });
});
