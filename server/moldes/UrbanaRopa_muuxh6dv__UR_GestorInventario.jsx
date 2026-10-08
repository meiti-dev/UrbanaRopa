/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const soyAdmin = MEITI.soyDuenoDeLaApp() || MEITI.miRolEnLaApp() === 'admin';

  const [variantes, setVariantes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [talles, setTalles] = useState([]);
  const [colores, setColores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [filtroProd, setFiltroProd] = useState('');
  
  const vacio = { id: '', producto_id: '', talle_id: '', color_id: '', stock: '0', sku: '' };
  const [form, setForm] = useState(vacio);
  const [editando, setEditando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resVar, resProd, resTal, resCol, resCat] = await Promise.all([
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_variantes')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_productos')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_talles')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_colores')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_categorias')}?ecosistema=${eco}`)
      ]);

      if (resVar.ok) setVariantes(resVar.registros || []);
      if (resProd.ok) setProductos(resProd.registros || []);
      if (resTal.ok) setTalles(resTal.registros.sort((a,b) => (a.orden||0)-(b.orden||0)) || []);
      if (resCol.ok) setColores(resCol.registros.sort((a,b) => (a.orden||0)-(b.orden||0)) || []);
      if (resCat.ok) setCategorias(resCat.registros || []);
    } catch (err) {
      setError(MEITI.t('err_load_inventory', null, 'Error al cargar el inventario.'));
    }
    setCargando(false);
  };

  useEffect(() => {
    if (soyAdmin) cargarDatos();
  }, [soyAdmin]);

  if (!soyAdmin) return <UI.Aviso tono="peligro" mensaje={MEITI.t('admin_only', null, 'Acceso denegado. Solo administradores.')} />;

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (!form.producto_id || !form.talle_id || !form.color_id) {
      return setError(MEITI.t('err_req_variant', null, 'Producto, talle y color son obligatorios.'));
    }

    setGuardando(true);
    const esNuevo = !form.id;
    const payload = {
      id: esNuevo ? 'var_' + Date.now() : form.id,
      producto_id: form.producto_id,
      talle_id: form.talle_id,
      color_id: form.color_id,
      stock: Number(form.stock) || 0,
      sku: form.sku.trim()
    };

    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('ur_variantes')}?ecosistema=${eco}`, {
      method: esNuevo ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('msg_variant_saved', null, 'Variante guardada correctamente.'));
        setForm(vacio);
        setEditando(false);
        cargarDatos();
        setGuardando(false);
      },
      alFallar: (err) => {
        setError(err || MEITI.t('err_save_variant', null, 'Error al guardar la variante.'));
        setGuardando(false);
      }
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('q_delete_variant', null, '¿Borrar esta variante del inventario?'), { titulo: MEITI.t('delete', null, 'Borrar'), confirmar: MEITI.t('yes_delete', null, 'Sí, borrar'), tono: 'peligro' })) return;
    
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('ur_variantes')}?ecosistema=${eco}&id=${id}`, {
      method: 'DELETE'
    }, {
      alLograr: () => {
        setExito(MEITI.t('msg_variant_deleted', null, 'Variante eliminada.'));
        if (form.id === id) { setForm(vacio); setEditando(false); }
        cargarDatos();
      },
      alFallar: (err) => setError(err || MEITI.t('err_delete_variant', null, 'Error al eliminar.'))
    });
  };

  const abrirEdicion = (fila) => {
    setForm({
      id: fila.id,
      producto_id: fila.producto_id || '',
      talle_id: fila.talle_id || '',
      color_id: fila.color_id || '',
      stock: String(fila.stock || 0),
      sku: fila.sku || ''
    });
    setEditando(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dataTabla = variantes.map(v => {
    const prod = productos.find(p => p.id === v.producto_id) || {};
    const talle = talles.find(t => t.id === v.talle_id) || {};
    const color = colores.find(c => c.id === v.color_id) || {};
    const cat = categorias.find(c => c.id === prod.categoria_id) || {};
    return {
      ...v,
      producto_nombre: prod.nombre || '---',
      categoria_nombre: cat.nombre || '---',
      talle_nombre: talle.nombre || '---',
      color_nombre: color.nombre || '---',
      color_hex: color.hex || '#ccc',
      imagen: prod.imagen_principal
    };
  });

  const filtrados = filtroProd 
    ? dataTabla.filter(v => v.producto_id === filtroProd)
    : dataTabla;

  const columnas = [
    { 
      clave: 'producto_nombre', 
      etiqueta: MEITI.t('col_product', null, 'Producto'), 
      render: f => (
        <div className="flex items-center gap-3">
          {f.imagen ? (
            <img src={f.imagen} alt={f.producto_nombre} className="w-8 h-8 rounded object-cover" />
          ) : (
            <div className="w-8 h-8 rounded bg-black/5 flex items-center justify-center"><Iconos.Package size={14} opacity={0.5} /></div>
          )}
          <div className="flex flex-col">
            <span className="font-bold">{f.producto_nombre}</span>
            <span className="text-xs opacity-60">{f.categoria_nombre}</span>
          </div>
        </div>
      )
    },
    { clave: 'sku', etiqueta: MEITI.t('col_sku', null, 'SKU'), render: f => <span className="font-mono text-xs opacity-80">{f.sku || '---'}</span> },
    { clave: 'talle_nombre', etiqueta: MEITI.t('col_size', null, 'Talle') },
    { 
      clave: 'color_nombre', 
      etiqueta: MEITI.t('col_color', null, 'Color'),
      render: f => (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border border-black/10" style={{ background: f.color_hex }}></div>
          <span>{f.color_nombre}</span>
        </div>
      )
    },
    { 
      clave: 'stock', 
      etiqueta: MEITI.t('col_stock', null, 'Stock'), 
      render: f => (
        <UI.Chip tono={Number(f.stock) === 0 ? 'peligro' : Number(f.stock) <= 5 ? 'alerta' : 'exito'}>
          {f.stock} unds
        </UI.Chip>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <UI.Tarjeta className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b pb-3" style={{ borderColor: tema.texto + '22' }}>
            <Iconos.Boxes size={24} color={tema.colorPrimario} />
            <h2 className="text-xl font-bold" style={{ color: tema.texto }}>{editando ? MEITI.t('title_edit_variant', null, 'Editar Variante') : MEITI.t('title_new_variant', null, 'Ingresar Nueva Variante')}</h2>
          </div>

          <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
          <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

          <form onSubmit={guardar} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('lbl_product', null, 'Producto Base')}
                  tipo="select"
                  valor={form.producto_id}
                  onChange={e => setForm({...form, producto_id: e.target.value})}
                  opciones={[{value: '', label: MEITI.t('ph_select_prod', null, 'Seleccionar...')}, ...productos.map(p => ({value: p.id, label: p.nombre}))]}
                />
              </div>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('lbl_size', null, 'Talle')}
                  tipo="select"
                  valor={form.talle_id}
                  onChange={e => setForm({...form, talle_id: e.target.value})}
                  opciones={[{value: '', label: MEITI.t('ph_select_size', null, 'Seleccionar...')}, ...talles.map(t => ({value: t.id, label: t.nombre}))]}
                />
              </div>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('lbl_color', null, 'Color')}
                  tipo="select"
                  valor={form.color_id}
                  onChange={e => setForm({...form, color_id: e.target.value})}
                  opciones={[{value: '', label: MEITI.t('ph_select_color', null, 'Seleccionar...')}, ...colores.map(c => ({value: c.id, label: c.nombre}))]}
                />
              </div>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('lbl_sku', null, 'Código SKU (Opcional)')}
                  tipo="text"
                  valor={form.sku}
                  onChange={e => setForm({...form, sku: e.target.value})}
                  placeholder="Ej: REM-BLA-M"
                />
              </div>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta={MEITI.t('lbl_stock_qty', null, 'Cantidad en Stock')}
                  tipo="number"
                  valor={form.stock}
                  onChange={e => setForm({...form, stock: e.target.value})}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <UI.Boton tipo="submit" variante="primario" disabled={guardando}>
                <span className="flex items-center gap-2">
                  <Iconos.Save size={18} /> 
                  {guardando ? MEITI.t('saving', null, 'Guardando...') : (editando ? MEITI.t('btn_update_stock', null, 'Actualizar Inventario') : MEITI.t('btn_add_variant', null, 'Agregar al Inventario'))}
                </span>
              </UI.Boton>
              {editando && (
                <UI.Boton tipo="button" variante="secundario" onClick={() => { setForm(vacio); setEditando(false); }}>
                  <span className="flex items-center gap-2"><Iconos.X size={18} /> {MEITI.t('btn_cancel', null, 'Cancelar')}</span>
                </UI.Boton>
              )}
            </div>
          </form>
        </UI.Tarjeta>
      </Animacion.motion.div>

      <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <UI.Tarjeta className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Iconos.ListChecks size={20} color={tema.colorSecundario} />
              <UI.Etiqueta>{MEITI.t('title_inventory_list', null, 'Inventario Actual')}</UI.Etiqueta>
            </div>
            <div className="w-full md:w-64">
              <UI.Desplegable 
                valor={filtroProd}
                onCambio={e => setFiltroProd(e.target.value)}
                opciones={[{value: '', label: MEITI.t('filter_all_prods', null, 'Todos los productos')}, ...productos.map(p => ({value: p.id, label: p.nombre}))]}
              />
            </div>
          </div>

          {cargando ? (
            <div className="p-8 text-center"><Iconos.LoaderCircle className="animate-spin mx-auto" size={32} color={tema.colorPrimario} /></div>
          ) : filtrados.length === 0 ? (
            <UI.EstadoVacio icono="fa-box-open" mensaje={MEITI.t('empty_inventory', null, 'No hay variantes registradas en el inventario.')} />
          ) : (
            <UI.TablaDatos 
              columnas={columnas}
              datos={filtrados}
              claveId="id"
              onEditar={abrirEdicion}
              onBorrar={f => borrar(f.id)}
            />
          )}
        </UI.Tarjeta>
      </Animacion.motion.div>
    </div>
  );
}