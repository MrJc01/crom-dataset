import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UploadModal from './UploadModal';

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'test-write-token'),
  setItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock do fetch
global.fetch = vi.fn();

describe('UploadModal Component', () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  it('renders form fields correctly', async () => {
    fetch.mockImplementation((url) => {
      if (url === '/api/licenses') {
        return Promise.resolve({
          ok: true,
          json: async () => ([{ id: 1, name: 'CC0' }])
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<UploadModal onClose={() => {}} onUploadSuccess={() => {}} />);

    // Verifica se campos existem pelos placeholders atuais
    expect(screen.getByPlaceholderText('Ex: Texturas 4K')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Detalhes...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ex: Imagens')).toBeInTheDocument();

    // Verifica modal title
    expect(screen.getByText('Publicar Dataset')).toBeInTheDocument();
  });

  it('handles form submission with link tab', async () => {
    const mockOnClose = vi.fn();
    const mockOnUploadSuccess = vi.fn();

    fetch.mockImplementation((url) => {
      if (url === '/api/licenses') {
        return Promise.resolve({
          ok: true,
          json: async () => ([{ id: 1, name: 'CC0' }])
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: 1, title: 'Test' })
      });
    });

    render(<UploadModal onClose={mockOnClose} onUploadSuccess={mockOnUploadSuccess} />);

    // Preenche o formulário com os novos placeholders
    fireEvent.change(screen.getByPlaceholderText('Ex: Texturas 4K'), { target: { value: 'Test Dataset' } });
    fireEvent.change(screen.getByPlaceholderText('Detalhes...'), { target: { value: 'Descrição...' } });

    // Submete
    const submitBtn = screen.getByText('Publicar');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/items', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('shows error when no token configured', async () => {
    localStorageMock.getItem.mockReturnValueOnce(null);

    fetch.mockImplementation((url) => {
      if (url === '/api/licenses') {
        return Promise.resolve({
          ok: true,
          json: async () => ([{ id: 1, name: 'CC0' }])
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<UploadModal onClose={() => {}} onUploadSuccess={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Ex: Texturas 4K'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Detalhes...'), { target: { value: 'Desc' } });

    const submitBtn = screen.getByText('Publicar');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Nenhum token configurado.')).toBeInTheDocument();
    });
  });
});
