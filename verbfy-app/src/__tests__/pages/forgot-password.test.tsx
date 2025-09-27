import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordPage from '../../../pages/forgot-password';
import * as apiModule from '../../lib/api';

jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('ForgotPasswordPage', () => {
  it('submits email and shows message', async () => {
    const api = (require('../../lib/api').default as any);
    api.post.mockResolvedValueOnce({ data: { message: 'If that account exists' } });
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));
    await waitFor(() => expect(screen.getByText(/If that account exists/i)).toBeInTheDocument());
  });
});


