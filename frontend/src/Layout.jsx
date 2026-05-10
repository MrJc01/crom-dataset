import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import UploadModal from './components/UploadModal';

function Layout() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    if (val && location.pathname !== '/explore') {
      navigate('/explore?q=' + encodeURIComponent(val));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-crom-dark">
      <Navbar 
        onOpenUpload={() => setIsUploadModalOpen(true)} 
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
      />
      
      <main className="flex-1">
        <Outlet context={{ searchTerm, setSearchTerm }} />
      </main>

      {/* Footer */}
      <footer className="border-t border-crom-border bg-crom-darker py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-crom-accent/20 p-1.5 rounded-lg">
                <i className="ph ph-database text-crom-accent-light text-lg"></i>
              </div>
              <span className="font-display font-bold text-sm text-crom-text">
                dados.crom<span className="text-crom-text-dim">.run</span>
              </span>
            </div>
            <p className="text-xs text-crom-text-dim">
              © 2026 CROM Dataset — Dados abertos para todos. 
              <a href="https://github.com/mrj-crom" target="_blank" rel="noreferrer" className="text-crom-accent-light hover:text-crom-accent ml-1 transition-colors">
                GitHub
              </a>
            </p>
            <div className="flex items-center gap-4 text-crom-text-dim">
              <a href="/about" className="text-xs hover:text-crom-text transition-colors">Sobre</a>
              <a href="/explore" className="text-xs hover:text-crom-text transition-colors">Explorar</a>
            </div>
          </div>
        </div>
      </footer>

      {isUploadModalOpen && (
        <UploadModal 
          onClose={() => setIsUploadModalOpen(false)} 
          onUploadSuccess={() => {
            if (location.pathname === '/explore') {
                window.location.reload();
            } else {
                navigate('/explore');
            }
          }} 
        />
      )}
    </div>
  );
}

export default Layout;
