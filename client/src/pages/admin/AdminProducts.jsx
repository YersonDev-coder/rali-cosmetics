import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const EMPTY = { nombre: '', descripcion: '', precio: '', stock: '', categoria_id: '', activo: true, imagen_url: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imgFile, setImgFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tieneVariantes, setTieneVariantes] = useState(false);
  const [variantes, setVariantes] = useState([]);

  const load = (q = '') => {
    setLoading(true);
    api.get('/admin/products', { params: { search: q, limit: 50 } })
      .then(r => setProducts(r.data.products))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); api.get('/categories').then(r => setCategories(r.data)); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setImgFile(null);
    setTieneVariantes(false);
    setVariantes([]);
    setShowForm(true);
  };

  const openEdit = async (p) => {
    setEditing(p);
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, stock: p.stock, categoria_id: p.categoria_id || '', activo: p.activo, imagen_url: p.imagen_url || '' });
    setImgFile(null);
    const tv = !!p.tiene_variantes;
    setTieneVariantes(tv);
    if (tv) {
      try {
        const resp = await api.get(`/products/${p.id}`);
        setVariantes((resp.data.variantes || []).map(v => ({ nombre: v.nombre, stock: String(v.stock) })));
      } catch {
        setVariantes([]);
      }
    } else {
      setVariantes([]);
    }
    setShowForm(true);
  };

  const addVariante = () => setVariantes(prev => [...prev, { nombre: '', stock: '' }]);
  const removeVariante = (i) => setVariantes(prev => prev.filter((_, idx) => idx !== i));
  const updateVariante = (i, field, val) => setVariantes(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: val } : v));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tieneVariantes && variantes.filter(v => v.nombre.trim()).length === 0) {
      toast.error('Agrega al menos un tono/color');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'stock' || !tieneVariantes) fd.append(k, v);
      });
      if (tieneVariantes) fd.append('stock', '0');
      if (imgFile) fd.append('imagen', imgFile);
      fd.append('variantes', JSON.stringify(tieneVariantes ? variantes.filter(v => v.nombre.trim()) : []));

      if (editing) {
        await api.put(`/admin/products/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Producto actualizado');
      } else {
        await api.post('/admin/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Producto creado');
      }
      setShowForm(false);
      load(search);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Producto eliminado');
      load(search);
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-playfair text-2xl font-bold text-primary-dark">Productos</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />Nuevo
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => { setSearch(e.target.value); load(e.target.value); }}
            className="w-full sm:w-72 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        {loading ? <LoadingSpinner fullPage /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Imagen', 'Nombre', 'Categoría', 'Precio', 'Stock', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className={(!p.tiene_variantes && p.stock === 0) ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3">
                      <img src={p.imagen_url || 'https://placehold.co/48x48/FCE4EC/C2185B?text=R'}
                        alt={p.nombre} className="w-12 h-12 object-cover rounded-lg" />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium max-w-xs">
                      <p className="line-clamp-2">{p.nombre}</p>
                      {p.tiene_variantes && <span className="text-xs text-primary font-medium">Con tonos</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.categoria_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold">S/ {parseFloat(p.precio).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">
                      {p.tiene_variantes
                        ? <span className="text-primary font-medium text-xs">Variantes</span>
                        : <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : 'text-green-600'}`}>{p.stock}</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-estado ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Sin productos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-playfair text-xl font-bold text-primary-dark mb-5">
              {editing ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="input-field w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio (S/) *</label>
                <input required type="number" step="0.01" min="0" value={form.precio}
                  onChange={e => setForm({ ...form, precio: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
              </div>

              {/* Toggle variantes */}
              <div className="flex items-center gap-2 py-1">
                <input type="checkbox" id="tieneVariantes" checked={tieneVariantes}
                  onChange={e => { setTieneVariantes(e.target.checked); if (!e.target.checked) setVariantes([]); }}
                  className="accent-primary" />
                <label htmlFor="tieneVariantes" className="text-sm font-medium text-gray-700">
                  ¿Este producto tiene tonos/colores?
                </label>
              </div>

              {/* Stock simple (sin variantes) */}
              {!tieneVariantes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                  <input required type="number" min="0" value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                </div>
              )}

              {/* Sección variantes */}
              {tieneVariantes && (
                <div className="bg-primary-light rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-primary-dark mb-1">Tonos / Colores</p>
                  {variantes.map((v, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Nombre del tono (ej: Beige claro)"
                        value={v.nombre}
                        onChange={e => updateVariante(i, 'nombre', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        min="0"
                        value={v.stock}
                        onChange={e => updateVariante(i, 'stock', e.target.value)}
                        className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      />
                      <button type="button" onClick={() => removeVariante(i)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0">
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addVariante}
                    className="mt-1 text-sm text-primary font-medium hover:underline flex items-center gap-1">
                    <PlusIcon className="w-3.5 h-3.5" /> Agregar otro tono
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary">
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                {(form.imagen_url || imgFile) && (
                  <img src={imgFile ? URL.createObjectURL(imgFile) : form.imagen_url}
                    alt="preview" className="w-24 h-24 object-cover rounded-xl mb-2" />
                )}
                <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])}
                  className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-light file:text-primary-dark" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="activo" checked={form.activo}
                  onChange={e => setForm({ ...form, activo: e.target.checked })} className="accent-primary" />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700">Activo</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1 py-2.5">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 disabled:opacity-60">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
