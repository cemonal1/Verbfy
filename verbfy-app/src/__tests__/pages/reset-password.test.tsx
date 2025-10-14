import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPasswordPage from '../../../pages/reset-password';
import api from '../../lib/api';

jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('ResetPasswordPage', () => {
  it('submits new password when valid', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'Password has been reset' } });
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));
    await waitFor(() => expect(screen.getByText(/Password has been reset/i)).toBeInTheDocument());
  });
});


