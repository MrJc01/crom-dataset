import React from 'react';
import { Link } from 'react-router-dom';

function DatasetCard({ item, index }) {
  const delay = (index || 0) * 60;
  
  let metadata = {};
  if (item.provider_metadata && typeof item.provider_metadata === 'object') {
    metadata = item.provider_metadata;
  }
  
  const isCode = ['csv', 'json', 'sql', 'py', 'ipynb'].includes(item.category?.toLowerCase());
  const typeLabel = item.category || 'Outros';
  const licenseLabel = item.license_name || 'Uso Livre';
  const size = metadata.size || '—';
  const downloads = metadata.downloads || '0';

  // Cor semântica da licença
  const getLicenseColor = () => {
    const name = (item.license_name || '').toLowerCase();
    if (name.includes('cc0') || name.includes('domínio') || name.includes('público')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    if (name.includes('by 4') || name.includes('comercial')) return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
    if (name.includes('nc') || name.includes('não comercial') || name.includes('non-commercial')) return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
    if (name.includes('proprietária')) return 'bg-red-500/15 text-red-400 border-red-500/20';
    return 'bg-crom-surface-3 text-crom-text-muted border-crom-border';
  };

  // Cor semântica do provedor
  const getProviderColor = () => {
    const p = (item.provider || '').toLowerCase();
    if (p.includes('hugging')) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    if (p.includes('suno')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-crom-accent/10 text-crom-accent-light border-crom-accent/20';
  };

  return (
    <Link 
      to={`/dataset/${item.id}`}
      className="card-surface overflow-hidden flex flex-col group gradient-border opacity-0 animate-fade-in cursor-pointer" 
      style={{ animationDelay: `${delay}ms` }}
      id={`dataset-card-${item.id}`}
    >
      {/* Card Header / Preview */}
      <div className="h-36 w-full relative overflow-hidden border-b border-crom-border flex items-center justify-center">
        {isCode ? (
          <div className="absolute inset-0 bg-crom-darker p-4 font-mono text-xs overflow-hidden flex flex-col">
            <div className="flex gap-1.5 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-500/80"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/80"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/80"></div>
            </div>
            <div className="text-emerald-400/70 flex-1 overflow-hidden leading-relaxed">
                <span className="text-crom-text-dim">// {item.title}</span><br/>
                <span className="text-crom-accent-light">const</span> data = <span className="text-amber-400">load</span>(<span className="text-emerald-300">'{typeLabel}'</span>)<br/>
                <span className="text-crom-accent-light">function</span> <span className="text-blue-400">process</span>(data) {'{'}<br/>
                &nbsp;&nbsp;<span className="text-pink-400">return</span> data.filter(…)<br/>
                {'}'}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-crom-surface-2 to-crom-darker flex items-center justify-center group-hover:from-crom-surface-3 transition-all duration-500">
            <i className="ph ph-file text-5xl text-crom-text-dim/40 group-hover:text-crom-accent/30 transition-colors duration-300"></i>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-crom-dark/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
          <span className="bg-crom-accent text-white rounded-full px-4 py-2 text-xs font-medium transform translate-y-3 group-hover:translate-y-0 transition-all duration-300 shadow-glow flex items-center gap-1.5">
            <i className="ph ph-eye"></i> Ver Detalhes
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-crom-dark/80 backdrop-blur-sm text-crom-text border border-crom-border/50 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-crom-accent"></span>
            {typeLabel}
          </span>
        </div>
      </div>
      
      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-crom-text line-clamp-2 leading-snug group-hover:text-crom-accent-light transition-colors duration-200 mb-2">
          {item.title}
        </h3>
        
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getLicenseColor()}`}>
            <i className="ph ph-certificate mr-0.5"></i>{licenseLabel}
          </span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${getProviderColor()}`}>
            {item.provider}
          </span>
        </div>

        <p className="text-xs text-crom-text-dim line-clamp-2 flex-1 leading-relaxed">{item.description}</p>
        
        {/* Meta Footer */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-crom-text-dim border-t border-crom-border/50 pt-3">
          <div className="flex items-center gap-1">
            <i className="ph ph-hard-drives text-crom-text-dim"></i>
            {size}
          </div>
          <div className="flex items-center gap-1">
            <i className="ph ph-download-simple text-crom-text-dim"></i>
            {downloads}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default DatasetCard;
