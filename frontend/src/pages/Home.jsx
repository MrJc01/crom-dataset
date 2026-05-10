import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DatasetCard from '../components/DatasetCard';

function Home() {
  const [recentItems, setRecentItems] = useState([]);
  const [stats, setStats] = useState({ total_items: 0, total_categories: 0, total_providers: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('crom_token') || 'default-read-token';
    
    Promise.all([
      fetch('/api/items?page=1&limit=6', { headers: { 'X-API-Key': token } }).then(r => r.json()).catch(() => []),
      fetch('/api/stats').then(r => r.json()).catch(() => ({ total_items: 0, total_categories: 0, total_providers: 0 })),
    ]).then(([items, statsData]) => {
      setRecentItems(items || []);
      setStats(statsData);
      setLoading(false);
    });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate('/explore?q=' + encodeURIComponent(searchInput));
    }
  };

  const categories = [
    { name: 'Vídeo', icon: 'ph-film-strip', color: 'from-rose-500/20 to-orange-500/20', iconColor: 'text-rose-400', profile: 'video' },
    { name: 'Código', icon: 'ph-code', color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400', profile: 'dev' },
    { name: 'Design', icon: 'ph-paint-brush-broad', color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400', profile: 'design' },
    { name: 'Áudio', icon: 'ph-music-notes', color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-400', profile: 'audio' },
  ];

  return (
    <div className="min-h-screen">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-pattern">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-crom-accent/8 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <div className="opacity-0 animate-slide-up">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-crom-accent/10 text-crom-accent-light border border-crom-accent/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-crom-success animate-pulse"></span>
              Plataforma de Dados Abertos
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 opacity-0 animate-slide-up animate-delay-100">
            <span className="text-crom-text">Encontre os dados certos</span>
            <br />
            <span className="gradient-text">para o seu próximo projeto</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-crom-text-muted mb-10 opacity-0 animate-slide-up animate-delay-200">
            Acesse datasets públicos e gratuitos — de vídeos em 4K a bancos SQL. 
            Tudo organizado, documentado e pronto para uso.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto opacity-0 animate-slide-up animate-delay-300">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-crom-accent/30 via-purple-500/20 to-crom-accent/30 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-500"></div>
              <div className="relative flex items-center bg-crom-surface border border-crom-border rounded-xl overflow-hidden">
                <div className="pl-4 flex items-center pointer-events-none">
                  <i className="ph ph-magnifying-glass text-lg text-crom-text-dim"></i>
                </div>
                <input 
                  type="text" 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar datasets, categorias, provedores..." 
                  className="flex-1 bg-transparent px-3 py-4 text-crom-text placeholder-crom-text-dim focus:outline-none text-sm sm:text-base"
                  id="hero-search"
                />
                <button 
                  type="submit"
                  className="btn-primary mr-1.5 !rounded-lg flex items-center gap-2"
                >
                  <i className="ph ph-arrow-right"></i>
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat, i) => (
            <Link 
              key={cat.name}
              to={`/explore?profile=${cat.profile}`}
              className={`card-surface p-5 text-center group opacity-0 animate-fade-in hover:scale-[1.02]`}
              style={{ animationDelay: `${400 + i * 80}ms` }}
              id={`cat-${cat.profile}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <i className={`ph ${cat.icon} text-2xl ${cat.iconColor}`}></i>
              </div>
              <span className="text-sm font-semibold text-crom-text">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="card-surface p-6 grid grid-cols-3 gap-4 text-center">
          <div className="opacity-0 animate-fade-in animate-delay-200">
            <div className="text-2xl sm:text-3xl font-display font-bold gradient-text">{stats.total_items}</div>
            <div className="text-xs text-crom-text-dim mt-1 uppercase tracking-wider">Datasets</div>
          </div>
          <div className="border-x border-crom-border opacity-0 animate-fade-in animate-delay-300">
            <div className="text-2xl sm:text-3xl font-display font-bold gradient-text">{stats.total_categories}</div>
            <div className="text-xs text-crom-text-dim mt-1 uppercase tracking-wider">Categorias</div>
          </div>
          <div className="opacity-0 animate-fade-in animate-delay-400">
            <div className="text-2xl sm:text-3xl font-display font-bold gradient-text">{stats.total_providers}</div>
            <div className="text-xs text-crom-text-dim mt-1 uppercase tracking-wider">Provedores</div>
          </div>
        </div>
      </section>

      {/* Recent Datasets */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-crom-text">Últimos Datasets</h2>
            <p className="text-sm text-crom-text-dim mt-1">Publicados recentemente pela comunidade</p>
          </div>
          <Link to="/explore" className="btn-secondary text-sm flex items-center gap-2" id="btn-view-all">
            Ver Todos <i className="ph ph-arrow-right"></i>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-2 border-crom-accent/30 border-t-crom-accent rounded-full animate-spin"></div>
          </div>
        ) : recentItems.length === 0 ? (
          <div className="card-surface p-12 text-center">
            <i className="ph ph-database text-4xl text-crom-text-dim/40 mb-3"></i>
            <h3 className="text-lg font-medium text-crom-text">Nenhum dataset ainda</h3>
            <p className="text-sm text-crom-text-dim mt-1">Seja o primeiro a publicar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentItems.map((item, idx) => (
              <DatasetCard key={item.id} item={item} index={idx} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
