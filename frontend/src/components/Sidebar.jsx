import React from 'react';

function Sidebar({ activeProfile, setActiveProfile, selectedLicenses = [], onLicenseToggle = () => {} }) {
  const profiles = [
    { id: 'all', label: 'Todos os Arquivos', icon: 'ph-squares-four' },
    { id: 'video', label: 'Editor de Vídeo', icon: 'ph-film-strip' },
    { id: 'dev', label: 'Programador / Data', icon: 'ph-code' },
    { id: 'design', label: 'Designer', icon: 'ph-paint-brush-broad' },
    { id: 'audio', label: 'Áudio / Música', icon: 'ph-music-notes' },
  ];

  const licenses = [
    'CC0 1.0 (Domínio Público)',
    'CC BY 4.0 (Uso Comercial)',
    'CC BY-NC 4.0 (Não Comercial)',
    'Suno Non-Commercial',
    'Proprietária',
  ];

  return (
    <aside className="w-full lg:w-60 flex-shrink-0 space-y-4">
      {/* Profile Filter */}
      <div className="card-surface p-4">
        <h3 className="text-[10px] font-semibold text-crom-text-dim uppercase tracking-widest mb-3">Perfil</h3>
        <div className="space-y-1">
          {profiles.map(p => (
            <button 
              key={p.id} 
              onClick={() => setActiveProfile(p.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeProfile === p.id
                  ? 'bg-crom-accent/15 text-crom-accent-light border border-crom-accent/20'
                  : 'text-crom-text-muted hover:bg-crom-surface-2 hover:text-crom-text border border-transparent'
              }`}
              id={`filter-profile-${p.id}`}
            >
              <i className={`ph ${p.icon} text-base ${activeProfile === p.id ? 'text-crom-accent-light' : 'text-crom-text-dim'}`}></i>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* License Filter */}
      <div className="card-surface p-4">
        <h3 className="text-[10px] font-semibold text-crom-text-dim uppercase tracking-widest mb-3">Licença</h3>
        <div className="space-y-2">
          {licenses.map(l => {
            const isChecked = selectedLicenses.length === 0 || selectedLicenses.includes(l);
            return (
              <label key={l} className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={isChecked}
                  onChange={() => onLicenseToggle(l)}
                  className="h-3.5 w-3.5 rounded border-crom-border bg-crom-surface-2 text-crom-accent focus:ring-crom-accent/40 focus:ring-1 cursor-pointer accent-crom-accent"
                />
                <span className="text-xs text-crom-text-muted group-hover:text-crom-text transition-colors">{l}</span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
