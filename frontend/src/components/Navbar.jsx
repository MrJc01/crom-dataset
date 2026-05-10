import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TokenManager from './TokenManager';

function Navbar({ onOpenUpload, searchTerm, setSearchTerm }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home', icon: 'ph-house' },
    { to: '/explore', label: 'Explorar', icon: 'ph-compass' },
    { to: '/about', label: 'Sobre', icon: 'ph-info' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b border-crom-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="bg-crom-accent/20 p-2 rounded-xl group-hover:bg-crom-accent/30 transition-all duration-300 group-hover:shadow-glow">
              <i className="ph-fill ph-database text-crom-accent-light text-xl"></i>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-crom-text leading-none group-hover:text-white transition-colors">
                dados.crom<span className="text-crom-text-dim font-normal">.run</span>
              </span>
              <span className="text-[10px] text-crom-text-dim tracking-wider uppercase">datasets abertos</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 ml-8">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.to)
                    ? 'bg-crom-accent/15 text-crom-accent-light'
                    : 'text-crom-text-muted hover:text-crom-text hover:bg-crom-surface-2'
                }`}
              >
                <i className={`ph ${link.icon} text-base`}></i>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            
            {/* Global Search */}
            <div className="hidden md:flex flex-1 items-center max-w-xs ml-4">
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ph ph-magnifying-glass text-crom-text-dim group-focus-within:text-crom-accent-light transition-colors"></i>
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar datasets..." 
                  className="block w-full pl-9 pr-3 py-2 bg-crom-surface-2 border border-crom-border rounded-lg text-sm text-crom-text placeholder-crom-text-dim focus:outline-none focus:ring-2 focus:ring-crom-accent/30 focus:border-crom-accent/50 transition-all duration-200"
                />
              </div>
            </div>
            
            <button 
              onClick={onOpenUpload}
              className="btn-primary flex items-center gap-2 text-sm !py-2 !px-4"
              id="btn-new-dataset"
            >
              <i className="ph ph-plus-circle text-lg"></i>
              <span className="hidden sm:inline">Novo Dataset</span>
            </button>
            
            <TokenManager />

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-crom-text-muted hover:bg-crom-surface-2 transition-colors"
              id="btn-mobile-menu"
            >
              <i className={`ph ${mobileMenuOpen ? 'ph-x' : 'ph-list'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-crom-border animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-crom-accent/15 text-crom-accent-light'
                    : 'text-crom-text-muted hover:bg-crom-surface-2'
                }`}
              >
                <i className={`ph ${link.icon}`}></i>
                {link.label}
              </Link>
            ))}
            {/* Mobile Search */}
            <div className="pt-2">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar datasets..." 
                className="input-dark w-full text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
