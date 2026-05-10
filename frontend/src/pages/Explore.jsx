import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import DatasetCard from '../components/DatasetCard';
import Sidebar from '../components/Sidebar';

function Explore() {
  const { searchTerm } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('q') || searchTerm || '';
  const profileParam = searchParams.get('profile') || 'all';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeProfile, setActiveProfile] = useState(profileParam);
  const [selectedLicenses, setSelectedLicenses] = useState([]);
  const [sortBy, setSortBy] = useState('recent');

  const fetchItems = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('crom_token') || 'default-read-token';
      let url = `/api/items?page=${pageNum}&limit=20`;
      if (urlSearch) url += `&search=${encodeURIComponent(urlSearch)}`;
      const res = await fetch(url, { headers: { 'X-API-Key': token } });
      if (!res.ok) throw new Error('Erro ao buscar dados');
      const data = await res.json();
      const newItems = data || [];
      setHasMore(newItems.length >= 20);
      if (append) { setItems(prev => [...prev, ...newItems]); }
      else { setItems(newItems); }
    } catch (err) {
      console.error(err);
      if (!append) setItems([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { setPage(1); fetchItems(1, false); }, [urlSearch]);
  useEffect(() => { setActiveProfile(profileParam); }, [profileParam]);

  const handleLoadMore = () => { const n = page + 1; setPage(n); fetchItems(n, true); };

  const handleProfileChange = (profile) => {
    setActiveProfile(profile);
    const p = new URLSearchParams(searchParams);
    profile === 'all' ? p.delete('profile') : p.set('profile', profile);
    setSearchParams(p);
  };

  const handleLicenseToggle = (name) => {
    setSelectedLicenses(prev => prev.includes(name) ? prev.filter(l => l !== name) : [...prev, name]);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const s = !urlSearch || item.title.toLowerCase().includes(urlSearch.toLowerCase()) || item.description.toLowerCase().includes(urlSearch.toLowerCase());
      let p = true;
      if (activeProfile !== 'all') { const pr = item.provider_metadata?.profile || 'all'; p = pr === activeProfile || pr === 'all'; }
      let l = true;
      if (selectedLicenses.length > 0) l = selectedLicenses.includes(item.license_name);
      return s && p && l;
    });
  }, [items, urlSearch, activeProfile, selectedLicenses]);

  const sortedItems = useMemo(() => {
    const arr = [...filteredItems];
    if (sortBy === 'name') arr.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'provider') arr.sort((a, b) => (a.provider||'').localeCompare(b.provider||''));
    return arr;
  }, [filteredItems, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 opacity-0 animate-slide-up">
        <h1 className="font-display text-3xl font-bold text-crom-text tracking-tight">Explorar Datasets</h1>
        <p className="text-sm text-crom-text-muted mt-1">Navegue por todos os dados abertos disponíveis.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Sidebar activeProfile={activeProfile} setActiveProfile={handleProfileChange} selectedLicenses={selectedLicenses} onLicenseToggle={handleLicenseToggle} />

        <div className="flex-1 min-w-0">
          <div className="card-surface px-4 py-3 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-sm text-crom-text-muted">
              <span className="font-semibold text-crom-text">{sortedItems.length}</span> resultados
              {urlSearch && <span> para "<span className="text-crom-accent-light">{urlSearch}</span>"</span>}
            </span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-crom-surface-2 border border-crom-border rounded-lg px-2 py-1 text-xs text-crom-text focus:outline-none" id="sort-select">
              <option value="recent">Mais Recentes</option>
              <option value="name">Nome (A-Z)</option>
              <option value="provider">Provedor</option>
            </select>
          </div>

          {loading && page === 1 ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-2 border-crom-accent/30 border-t-crom-accent rounded-full animate-spin"></div>
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="card-surface p-16 text-center">
              <i className="ph ph-magnifying-glass text-4xl text-crom-text-dim/40 mb-3 block"></i>
              <h3 className="text-lg font-semibold text-crom-text">Nenhum dataset encontrado</h3>
              <p className="mt-1 text-sm text-crom-text-dim">Ajuste seus filtros ou busca.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {sortedItems.map((item, idx) => (<DatasetCard key={item.id} item={item} index={idx} />))}
              </div>
              {hasMore && !urlSearch && activeProfile === 'all' && (
                <div className="mt-10 flex justify-center pb-4">
                  <button onClick={handleLoadMore} disabled={loading} className="btn-secondary flex items-center gap-2 disabled:opacity-50" id="btn-load-more">
                    {loading ? (<><i className="ph ph-spinner animate-spin"></i> Carregando...</>) : (<><i className="ph ph-caret-down"></i> Carregar Mais</>)}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Explore;
