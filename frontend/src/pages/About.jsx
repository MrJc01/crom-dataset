import React from 'react';
import { Link } from 'react-router-dom';

function About() {
  const endpoints = [
    { method: 'GET', path: '/api/items', desc: 'Lista todos os datasets (paginado)', params: 'page, limit, search, category' },
    { method: 'GET', path: '/api/items/:id', desc: 'Detalhes de um dataset específico', params: 'id (path)' },
    { method: 'GET', path: '/api/stats', desc: 'Estatísticas gerais da plataforma', params: '—' },
    { method: 'GET', path: '/api/licenses', desc: 'Lista todas as licenças disponíveis', params: '—' },
    { method: 'POST', path: '/api/items', desc: 'Criar novo dataset', params: 'title, description, category, license_id, provider' },
    { method: 'POST', path: '/api/admin/tokens', desc: 'Gerar token de acesso (Admin)', params: 'email, role, monthly_limit' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-16 opacity-0 animate-slide-up">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-crom-accent/10 text-crom-accent-light border border-crom-accent/20 mb-4">
          <i className="ph ph-info"></i> Sobre a Plataforma
        </span>
        <h1 className="font-display text-4xl font-bold text-crom-text tracking-tight mb-4">
          O que é o <span className="gradient-text">CROM Dataset</span>?
        </h1>
        <p className="text-lg text-crom-text-muted max-w-2xl mx-auto leading-relaxed">
          Um repositório brasileiro de dados abertos, criado para centralizar datasets públicos e gratuitos 
          para desenvolvedores, designers, cientistas de dados e criadores de conteúdo.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
        {[
          { icon: 'ph-globe', title: 'Open Source', desc: 'Código aberto, transparente e auditável.' },
          { icon: 'ph-shield-check', title: 'Licenças Claras', desc: 'Cada dataset tem sua licença explicitada.' },
          { icon: 'ph-rocket', title: 'API REST', desc: 'Integre com qualquer aplicação via HTTP.' },
        ].map((f, i) => (
          <div key={f.title} className={`card-surface p-6 text-center opacity-0 animate-fade-in`} style={{ animationDelay: `${200 + i * 100}ms` }}>
            <div className="w-12 h-12 rounded-xl bg-crom-accent/10 flex items-center justify-center mx-auto mb-3">
              <i className={`ph ${f.icon} text-2xl text-crom-accent-light`}></i>
            </div>
            <h3 className="text-sm font-semibold text-crom-text mb-1">{f.title}</h3>
            <p className="text-xs text-crom-text-dim">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* How to Contribute */}
      <div className="card-surface p-8 mb-12 opacity-0 animate-slide-up animate-delay-200">
        <h2 className="font-display text-xl font-bold text-crom-text mb-4 flex items-center gap-2">
          <i className="ph ph-hand-heart text-crom-accent-light"></i> Como Contribuir
        </h2>
        <div className="space-y-4 text-sm text-crom-text-muted leading-relaxed">
          <p>1. Solicite um <strong className="text-crom-text">token de escrita</strong> ao administrador da plataforma.</p>
          <p>2. Configure o token no painel de perfil (ícone de usuário no canto superior).</p>
          <p>3. Clique em <strong className="text-crom-text">"Novo Dataset"</strong> e preencha as informações do arquivo.</p>
          <p>4. Você pode enviar via link externo ou fazer upload direto para o Hugging Face.</p>
        </div>
      </div>

      {/* API Documentation */}
      <div className="card-surface p-8 mb-12 opacity-0 animate-slide-up animate-delay-300">
        <h2 className="font-display text-xl font-bold text-crom-text mb-6 flex items-center gap-2">
          <i className="ph ph-code text-crom-accent-light"></i> Documentação da API
        </h2>

        <div className="space-y-3">
          {endpoints.map((ep, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-crom-surface-2 border border-crom-border/50">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-wider ${
                ep.method === 'GET' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
              }`}>
                {ep.method}
              </span>
              <code className="text-sm text-crom-accent-light font-mono">{ep.path}</code>
              <span className="text-xs text-crom-text-dim flex-1">{ep.desc}</span>
              <span className="text-[10px] text-crom-text-dim font-mono">{ep.params}</span>
            </div>
          ))}
        </div>

        {/* Example */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-crom-text mb-3">Exemplo de Requisição</h3>
          <div className="bg-crom-darker rounded-lg p-4 font-mono text-xs text-crom-text overflow-x-auto border border-crom-border">
            <span className="text-crom-text-dim"># Listar datasets</span><br/>
            <span className="text-emerald-400">curl</span> -H <span className="text-amber-400">"X-API-Key: seu-token"</span> \<br/>
            &nbsp;&nbsp;https://dados.crom.run/api/items?page=1&limit=10
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center opacity-0 animate-fade-in animate-delay-400">
        <Link to="/explore" className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
          <i className="ph ph-compass text-lg"></i> Começar a Explorar
        </Link>
      </div>
    </div>
  );
}

export default About;
