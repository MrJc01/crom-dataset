import React, { useState, useEffect } from 'react';

function UploadModal({ onClose, onUploadSuccess }) {
  const [activeTab, setActiveTab] = useState('link');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [licenseId, setLicenseId] = useState('');
  const [provider, setProvider] = useState('');
  const [profile, setProfile] = useState('all');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/licenses', { headers: { 'X-API-Key': 'default-read-token' } })
      .then(res => res.json())
      .then(data => { setLicenses(data); if (data.length > 0) setLicenseId(data[0].id); })
      .catch(err => console.error("Erro ao carregar licenças", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    const token = localStorage.getItem('crom_token');
    if (!token) { setError('Nenhum token configurado.'); setIsSubmitting(false); return; }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('license_id', licenseId);
    formData.append('provider', activeTab === 'file' ? 'HuggingFace' : provider);
    formData.append('profile', profile);
    if (activeTab === 'link') { formData.append('url', url); }
    else if (activeTab === 'file' && file) { formData.append('file', file); }
    else { setError('Anexe um arquivo.'); setIsSubmitting(false); return; }

    try {
      const res = await fetch('/api/items', { method: 'POST', headers: { 'X-API-Key': token }, body: formData });
      if (!res.ok) { const text = await res.text(); throw new Error(text || 'Falha no servidor'); }
      onUploadSuccess();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setIsSubmitting(false); }
  };

  const inputClass = "input-dark w-full text-sm";
  const labelClass = "block text-xs font-medium text-crom-text-muted mb-1.5 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom card-surface text-left overflow-hidden shadow-2xl sm:my-8 sm:align-middle sm:max-w-xl w-full animate-slide-up">
          {/* Header */}
          <div className="bg-crom-accent/10 px-6 py-4 border-b border-crom-accent/20 flex justify-between items-center">
            <h3 className="text-lg font-bold text-crom-accent-light flex items-center" id="modal-title">
              <i className="ph ph-cloud-arrow-up text-2xl mr-2"></i> Publicar Dataset
            </h3>
            <button onClick={onClose} className="text-crom-text-dim hover:text-crom-text transition-colors">
              <i className="ph ph-x text-xl"></i>
            </button>
          </div>

          <div className="px-6 py-5">
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2">
                <i className="ph ph-warning-circle text-red-400 text-lg flex-shrink-0 mt-0.5"></i>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Título</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Ex: Texturas 4K" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Descrição</label>
                  <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className={inputClass} placeholder="Detalhes..." />
                </div>
                <div>
                  <label className={labelClass}>Categoria</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} placeholder="Ex: Imagens" />
                </div>
                <div>
                  <label className={labelClass}>Licença</label>
                  <select value={licenseId} onChange={(e) => setLicenseId(e.target.value)} className={inputClass}>
                    {licenses.map(l => (<option key={l.id} value={l.id}>{l.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Perfil</label>
                  <select value={profile} onChange={(e) => setProfile(e.target.value)} className={inputClass}>
                    <option value="all">Geral</option>
                    <option value="dev">Programação</option>
                    <option value="video">Vídeo</option>
                    <option value="design">Design</option>
                    <option value="audio">Áudio</option>
                  </select>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-t border-crom-border pt-4">
                <div className="flex border-b border-crom-border mb-4">
                  {['link', 'file'].map(tab => (
                    <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                      className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-crom-accent text-crom-accent-light' : 'border-transparent text-crom-text-dim hover:text-crom-text'}`}>
                      <i className={`ph ${tab === 'link' ? 'ph-link' : 'ph-file-arrow-up'} mr-1`}></i>
                      {tab === 'link' ? 'Link Externo' : 'Upload'}
                    </button>
                  ))}
                </div>

                {activeTab === 'link' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Provedor</label>
                      <input type="text" value={provider} onChange={(e) => setProvider(e.target.value)} className={inputClass} placeholder="Ex: HuggingFace" />
                    </div>
                    <div>
                      <label className={labelClass}>URL</label>
                      <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} placeholder="https://..." />
                    </div>
                  </div>
                )}

                {activeTab === 'file' && (
                  <div>
                    <label className={labelClass}>Arquivo</label>
                    <input type="file" onChange={(e) => setFile(e.target.files[0])}
                      className="block w-full text-sm text-crom-text-dim file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-crom-accent/15 file:text-crom-accent-light hover:file:bg-crom-accent/25 transition-colors cursor-pointer" />
                    <p className="mt-1 text-xs text-crom-text-dim">Upload seguro via Hugging Face.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-row-reverse gap-3 border-t border-crom-border pt-4">
                <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? (<><i className="ph ph-spinner animate-spin"></i> Processando...</>) : 'Publicar'}
                </button>
                <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
