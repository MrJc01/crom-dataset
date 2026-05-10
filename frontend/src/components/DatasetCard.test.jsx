import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DatasetCard from './DatasetCard';

describe('DatasetCard Component', () => {
  const mockItem = {
    id: 1,
    title: 'Meu Dataset Teste',
    description: 'Descrição mockada',
    category: 'Audio',
    provider: 'Local',
    license_name: 'CC0 1.0 (Domínio Público)',
    created_at: '2026-05-10T12:00:00Z',
    provider_metadata: {}
  };

  it('renders correctly with given item', () => {
    render(
      <MemoryRouter>
        <DatasetCard item={mockItem} />
      </MemoryRouter>
    );
    
    // Testa se o título aparece
    expect(screen.getByText('Meu Dataset Teste')).toBeInTheDocument();
    
    // Testa se a descrição aparece
    expect(screen.getByText('Descrição mockada')).toBeInTheDocument();
    
    // Testa se a tag da categoria aparece (aparece 2x: badge header + body)
    const audioElements = screen.getAllByText('Audio');
    expect(audioElements.length).toBeGreaterThanOrEqual(1);
    
    // Testa se o provedor aparece
    expect(screen.getByText('Local')).toBeInTheDocument();

    // Testa link para detalhe
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/dataset/1');
  });

  it('renders default category when not provided', () => {
    const itemWithoutCategory = { ...mockItem, category: '' };
    render(
      <MemoryRouter>
        <DatasetCard item={itemWithoutCategory} />
      </MemoryRouter>
    );
    
    const outrosElements = screen.getAllByText('Outros');
    expect(outrosElements.length).toBeGreaterThanOrEqual(1);
  });
});
