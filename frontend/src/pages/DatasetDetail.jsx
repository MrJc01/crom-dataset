import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DatasetCard from '../components/DatasetCard';

function DatasetDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('crom_token') || 'default-read-token';
    setLoading(true);
    setError('');

    fetch(`/api/items/${id}`, { headers: { 'X-API-Key': token } })
      .then(res => {
        if (!res.ok) throw new Error('Dataset não encontrado');
        return res.json();
      })
      .then(data => {
        setItem(data);
        // Fetch related (same category)
        return fetch(`/api/items?limit=4&category=${encodeURIComponent(data.category || '')}`, { headers: { 'X-API-Key': token } })
          .then(r => r.json())
          .then(items => setRelated((items || []).filter(i => i.id !== data.id).slice(0, 3)))
          .catch(() => setRelated([]));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-crom-accent/30 border-t-crom-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <i className="ph ph-warning text-5xl text-crom-danger mb-4 block"></i>
        <h1 className="text-2xl font-display font-bold text-crom-text mb-2">Dataset não encontrado</h1>
        <p className="text-crom-text-dim mb-6">{error || 'O dataset solicitado não existe.'}</p>
        <Link to="/explore" className="btn-primary">Voltar para Explorar</Link>
      </div>
    );
  }

  const metadata = item.provider_metadata && typeof item.provider_metadata === 'object' ? item.provider_metadata : {};
  // [CASCA] Download passa pela API do CROM — URL do provedor nunca é exposta no HTML
  const hasDownload = !!metadata.url;
  const downloadApiUrl = `/api/download/${item.id}`;
  const licenseName = item.license_name || 'Não especificada';
  const createdDate = item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  const getLicenseBadge = () => {
    const n = licenseName.toLowerCase();
    if (n.includes('cc0') || n.includes('domínio')) return { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: 'ph-check-circle', label: 'Livre para qualquer uso' };
    if (n.includes('by 4') || n.includes('comercial')) return { color: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: 'ph-handshake', label: 'Uso comercial com atribuição' };
    if (n.includes('nc') || n.includes('non-commercial')) return { color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: 'ph-warning-circle', label: 'Apenas uso não-comercial' };
    if (n.includes('proprietária')) return { color: 'bg-red-500/15 text-red-400 border-red-500/20', icon: 'ph-lock', label: 'Restrições de uso aplicáveis' };
    return { color: 'bg-crom-surface-3 text-crom-text-muted border-crom-border', icon: 'ph-certificate', label: 'Verifique os termos' };
  };

  const badge = getLicenseBadge();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-crom-text-dim mb-8 opacity-0 animate-fade-in">
        <Link to="/" className="hover:text-crom-text transition-colors">Home</Link>
        <i className="ph ph-caret-right text-xs"></i>
        <Link to="/explore" className="hover:text-crom-text transition-colors">Explorar</Link>
        <i className="ph ph-caret-right text-xs"></i>
        <span className="text-crom-accent-light truncate max-w-[200px]">{item.title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Title Section */}
          <div className="opacity-0 animate-slide-up mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-crom-accent/10 text-crom-accent-light border border-crom-accent/20 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-crom-accent"></span>
                {item.category || 'Outros'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-crom-surface-3 text-crom-text-muted border border-crom-border">
                {item.provider}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-crom-text tracking-tight leading-tight">
              {item.title}
            </h1>
          </div>

          {/* Description */}
          <div className="card-surface p-6 mb-6 opacity-0 animate-slide-up animate-delay-100">
            <h2 className="text-sm font-semibold text-crom-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <i className="ph ph-article text-crom-accent-light"></i> Sobre este Dataset
            </h2>
            <p className="text-crom-text leading-relaxed whitespace-pre-wrap">
              {item.description || 'Sem descrição disponível.'}
            </p>
          </div>

          {/* License Box */}
          <div className={`card-surface p-6 mb-6 opacity-0 animate-slide-up animate-delay-200`}>
            <h2 className="text-sm font-semibold text-crom-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <i className="ph ph-certificate text-crom-accent-light"></i> Licença
            </h2>
            <div className={`flex items-start gap-3 p-4 rounded-lg border ${badge.color}`}>
              <i className={`ph ${badge.icon} text-2xl flex-shrink-0 mt-0.5`}></i>
              <div>
                <div className="font-semibold text-sm">{licenseName}</div>
                <div className="text-xs mt-1 opacity-80">{badge.label}</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="opacity-0 animate-slide-up animate-delay-300">
            {hasDownload ? (
              <a 
                href={downloadApiUrl}
                download
                className="w-full btn-primary text-center py-4 text-base font-semibold rounded-xl flex items-center justify-center gap-3 animate-pulse-glow"
                id="btn-download-dataset"
              >
                <i className="ph ph-download-simple text-xl"></i>
                Baixar / Acessar Dataset
              </a>
            ) : (
              <div className="w-full text-center py-4 text-base font-semibold rounded-xl flex items-center justify-center gap-3 bg-crom-surface-3 text-crom-text-dim border border-crom-border cursor-not-allowed">
                <i className="ph ph-prohibit text-xl"></i>
                Link Indisponível
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <aside className="lg:w-72 flex-shrink-0 space-y-4">
          <div className="card-surface p-5 opacity-0 animate-fade-in animate-delay-200">
            <h3 className="text-xs font-semibold text-crom-text-dim uppercase tracking-wider mb-4">Informações</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-crom-surface-3 flex items-center justify-center flex-shrink-0">
                  <i className="ph ph-calendar text-crom-text-dim"></i>
                </div>
                <div>
                  <div className="text-[10px] text-crom-text-dim uppercase">Publicado em</div>
                  <div className="text-sm text-crom-text font-medium">{createdDate}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-crom-surface-3 flex items-center justify-center flex-shrink-0">
                  <i className="ph ph-buildings text-crom-text-dim"></i>
                </div>
                <div>
                  <div className="text-[10px] text-crom-text-dim uppercase">Provedor</div>
                  <div className="text-sm text-crom-text font-medium">{item.provider || '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-crom-surface-3 flex items-center justify-center flex-shrink-0">
                  <i className="ph ph-tag text-crom-text-dim"></i>
                </div>
                <div>
                  <div className="text-[10px] text-crom-text-dim uppercase">Categoria</div>
                  <div className="text-sm text-crom-text font-medium">{item.category || '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-crom-surface-3 flex items-center justify-center flex-shrink-0">
                  <i className="ph ph-identification-badge text-crom-text-dim"></i>
                </div>
                <div>
                  <div className="text-[10px] text-crom-text-dim uppercase">ID</div>
                  <div className="text-sm text-crom-text font-medium">#{item.id}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="card-surface p-5 opacity-0 animate-fade-in animate-delay-300">
              <h3 className="text-xs font-semibold text-crom-text-dim uppercase tracking-wider mb-4">Relacionados</h3>
              <div className="space-y-3">
                {related.map(r => (
                  <Link key={r.id} to={`/dataset/${r.id}`} className="block p-3 rounded-lg bg-crom-surface-2 hover:bg-crom-surface-3 border border-crom-border/50 transition-colors group">
                    <div className="text-sm font-medium text-crom-text group-hover:text-crom-accent-light transition-colors line-clamp-1">{r.title}</div>
                    <div className="text-xs text-crom-text-dim mt-0.5">{r.provider}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default DatasetDetail;
