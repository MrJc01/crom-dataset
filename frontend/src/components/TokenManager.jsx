import React, { useState } from 'react';

function TokenManager() {
    const [isOpen, setIsOpen] = useState(false);
    const [token, setToken] = useState(localStorage.getItem('crom_token') || '');

    const handleSave = () => {
        localStorage.setItem('crom_token', token);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center text-crom-text-dim hover:text-crom-accent-light transition-colors p-2 rounded-lg hover:bg-crom-surface-2"
                title="Configurações de Conta"
                id="btn-token-manager"
            >
                <i className="ph ph-user-circle text-xl"></i>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-72 card-surface z-50 overflow-hidden shadow-card-hover animate-slide-down">
                        <div className="p-4 bg-crom-accent/10 border-b border-crom-accent/20">
                            <h3 className="text-sm font-bold text-crom-accent-light flex items-center">
                                <i className="ph ph-key mr-2"></i> Chave de Acesso
                            </h3>
                        </div>
                        <div className="p-4">
                            <p className="text-xs text-crom-text-dim mb-3">
                                Para enviar datasets, configure seu Token Pessoal de Escrita fornecido pelo administrador.
                            </p>
                            <input 
                                type="password" 
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Cole seu token aqui..."
                                className="input-dark w-full text-sm mb-3"
                                id="input-token"
                            />
                            <button 
                                onClick={handleSave}
                                className="w-full btn-primary text-sm"
                                id="btn-save-token"
                            >
                                Salvar Token
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default TokenManager;
