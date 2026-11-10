import NetInfo from '@react-native-community/netinfo';

import { availableBytes } from './free-space';
import { checkDownload } from './model-manager';
import { MODELS, requiredFreeBytes } from './model-store';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn() },
}));

jest.mock('./free-space', () => ({ availableBytes: jest.fn() }));

const model = MODELS['qwen3-0.6b-q'];
const fetchNet = NetInfo.fetch as jest.Mock;
const free = availableBytes as jest.Mock;

describe('checkDownload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    free.mockResolvedValue(requiredFreeBytes(model) + 1);
  });

  it('blocks when on cellular and the user has not confirmed', async () => {
    fetchNet.mockResolvedValue({ type: 'cellular', details: { isConnectionExpensive: true } });
    await expect(checkDownload(model, false)).resolves.toEqual({ ok: false, reason: 'cellular' });
  });

  it('allows cellular once the user confirms', async () => {
    fetchNet.mockResolvedValue({ type: 'cellular', details: { isConnectionExpensive: true } });
    await expect(checkDownload(model, true)).resolves.toEqual({ ok: true });
  });

  it('allows desktop web (NetInfo reports `other`, never wifi/ethernet)', async () => {
    fetchNet.mockResolvedValue({ type: 'other', details: { isConnectionExpensive: false } });
    await expect(checkDownload(model, false)).resolves.toEqual({ ok: true });
  });

  it('flags a data-saver connection as cellular', async () => {
    fetchNet.mockResolvedValue({ type: 'other', details: { isConnectionExpensive: true } });
    await expect(checkDownload(model, false)).resolves.toEqual({ ok: false, reason: 'cellular' });
  });

  it('reports how much room is missing when there is not enough space', async () => {
    free.mockResolvedValue(0);
    fetchNet.mockResolvedValue({ type: 'wifi', details: { isConnectionExpensive: false } });
    await expect(checkDownload(model, false)).resolves.toEqual({
      ok: false,
      reason: 'no-space',
      missingBytes: requiredFreeBytes(model),
    });
  });
});
