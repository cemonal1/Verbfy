import { render, screen, waitFor } from '@testing-library/react';
import VerifyEmailPage from '../../../pages/verify-email';
import * as apiModule from '../../lib/api';

jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe('VerifyEmailPage', () => {
  it('shows success on successful verification', async () => {
    const api = (require('../../lib/api').default as any);
    api.get.mockResolvedValueOnce({ data: { success: true } });
    // Render and simulate token via router mock if needed
    render(<VerifyEmailPage />);
    await waitFor(() => expect(screen.getByText(/Email verified/i)).toBeInTheDocument());
  });
});


