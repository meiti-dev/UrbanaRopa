/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const soyAdmin = MEITI.soyDuenoDeLaApp() || MEITI.miRolEnLaApp() === 'admin';

  const [pedidos, setPedidos] = useState([]);
  const [items, setItems] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resPed, resItm, resVar, resProd, resEst] = await Promise.all([
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_pedidos')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_pedido_items')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_variantes')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_productos')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_estados_pedido')}?ecosistema=${eco}`)
      ]);

      if (resPed.ok) setPedidos(resPed.registros.sort((a,b) => new Date(b.fecha_registro) - new Date(a.fecha_registro)));
      if (resItm.ok) setItems(resItm.registros);
      if (resVar.ok) setVariantes(resVar.registros);
      if (resProd.ok) setProductos(resProd.registros);
      if (resEst.ok) setEstados(resEst.registros);
    } catch (err) {
      setError(MEITI.t('err_load_orders', null, 'Error al cargar los pedidos.'));
    }
    setCargando(false);
  };

  useEffect(() => {
    if (soyAdmin) cargarDatos();
  }, [soyAdmin]);

  if (!soyAdmin) return <UI.Aviso tono="peligro" mensaje={MEITI.t('admin_only', null, 'Acceso denegado. Solo administradores.')} />;

  const actualizarEstado = async () => {
    if (!pedidoActivo || !nuevoEstado) return;
    setGuardando(true);
    const payload = { ...pedidoActivo, estado: nuevoEstado };
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('ur_pedidos')}?ecosistema=${eco}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setPedidoActivo(null);
        setNuevoEstado('');
        cargarDatos();
        setGuardando(false);
      },
      alFallar: (err) => {
        setError(err || MEITI.t('err_update_order', null, 'Error al actualizar el pedido.'));
        setGuardando(false);
      }
    });
  };

  const pedidosFiltrados = filtroEstado ? pedidos.filter(p => p.estado === filtroEstado) : pedidos;

  const columnas = [
    { clave: 'id', etiqueta: MEITI.t('col_id', null, 'ID'), render: f => f.id.split('_')[1] || f.id },
    { clave: 'fecha_registro', etiqueta: MEITI.t('col_date', null, 'Fecha'), tipo: 'fecha' },
    { clave: 'total', etiqueta: MEITI.t('col_total', null, 'Total'), tipo: 'moneda' },
    { clave: 'metodo_pago', etiqueta: MEITI.t('col_payment', null, 'Pago'), render: f => <span className="uppercase text-xs font-bold">{f.metodo_pago}</span> },
    { clave: 'estado', etiqueta: MEITI.t('col_status', null, 'Estado'), render: f => {
        const est = estados.find(e => e.nombre === f.estado);
        return <UI.Chip tono={est ? est.color : 'neutro'}>{f.estado || '---'}</UI.Chip>;
    }}
  ];

  const accionesExtra = [
    {
      etiqueta: MEITI.t('btn_view_details', null, 'Ver Detalles'),
      icono: 'fa-eye',
      tono: 'primario',
      onClick: (f) => { setPedidoActivo(f); setNuevoEstado(f.estado || ''); }
    }
  ];

  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0">
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />

      {!pedidoActivo ? (
        <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col flex-1 min-h-0">
          <UI.Tarjeta className="flex flex-col gap-4 flex-1 min-h-0">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Iconos.Package size={24} color={tema.colorPrimario} />
                <h2 className="text-xl font-bold" style={{ color: tema.texto }}>{MEITI.t('title_orders', null, 'Gestión de Pedidos')}</h2>
              </div>
              <div className="w-full md:w-64">
                <UI.Desplegable 
                  valor={filtroEstado} 
                  onCambio={e => setFiltroEstado(e.target.value)} 
                  opciones={[{value: '', label: MEITI.t('all_statuses', null, 'Todos los estados')}, ...estados.map(e => ({value: e.nombre, label: e.nombre}))]} 
                />
              </div>
            </div>

            {cargando ? (
              <div className="p-8 text-center"><Iconos.LoaderCircle className="animate-spin mx-auto" size={32} color={tema.colorPrimario} /></div>
            ) : pedidosFiltrados.length === 0 ? (
              <UI.EstadoVacio icono="fa-box-open" mensaje={MEITI.t('no_orders', null, 'No hay pedidos para mostrar.')} />
            ) : (
              <div className="flex-1 overflow-y-auto min-h-0">
                <UI.TablaDatos 
                  columnas={columnas} 
                  datos={pedidosFiltrados} 
                  claveId="id" 
                  accionesExtra={accionesExtra} 
                  advertirAccionIncompleta={false} 
                />
              </div>
            )}
          </UI.Tarjeta>
        </Animacion.motion.div>
      ) : (
        <Animacion.motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="flex flex-col flex-1 min-h-0">
          <UI.Tarjeta className="flex flex-col gap-6 flex-1 min-h-0">
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: tema.texto + '22' }}>
              <div className="flex items-center gap-3">
                <button onClick={() => setPedidoActivo(null)} className="p-2 rounded-full hover:bg-black/5 transition-colors">
                  <Iconos.ArrowLeft size={20} color={tema.texto} />
                </button>
                <h3 className="text-lg font-bold" style={{ color: tema.texto }}>
                  {MEITI.t('order_details_title', { id: pedidoActivo.id.split('_')[1] || pedidoActivo.id }, 'Pedido #{id}')}
                </h3>
              </div>
              <UI.Chip tono="neutro">{new Date(pedidoActivo.fecha_registro).toLocaleString()}</UI.Chip>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
              <div className="flex flex-col gap-4">
                <UI.Etiqueta>{MEITI.t('lbl_customer_info', null, 'Información de Envío')}</UI.Etiqueta>
                <div className="p-4 rounded-xl" style={{ background: tema.superficie }}>
                  <p className="text-sm opacity-80 mb-1" style={{ color: tema.texto }}>{MEITI.t('lbl_address', null, 'Dirección:')}</p>
                  <p className="font-medium mb-3" style={{ color: tema.texto }}>{pedidoActivo.direccion_envio || '---'}</p>
                  
                  <p className="text-sm opacity-80 mb-1" style={{ color: tema.texto }}>{MEITI.t('lbl_notes', null, 'Notas del cliente:')}</p>
                  <p className="font-medium italic" style={{ color: tema.texto }}>{pedidoActivo.notas || MEITI.t('no_notes', null, 'Sin notas')}</p>
                </div>

                <UI.Etiqueta>{MEITI.t('lbl_update_status', null, 'Actualizar Estado')}</UI.Etiqueta>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <UI.Campo 
                      tipo="select" 
                      valor={nuevoEstado} 
                      onChange={e => setNuevoEstado(e.target.value)} 
                      opciones={estados.map(e => ({value: e.nombre, label: e.nombre}))} 
                    />
                  </div>
                  <UI.Boton onClick={actualizarEstado} variante="primario" disabled={guardando || nuevoEstado === pedidoActivo.estado}>
                    {guardando ? <Iconos.LoaderCircle className="animate-spin" size={18} /> : <Iconos.Save size={18} />}
                  </UI.Boton>
                </div>
              </div>

              <div className="flex flex-col gap-4 flex-1 min-h-0">
                <UI.Etiqueta>{MEITI.t('lbl_order_items', null, 'Artículos del Pedido')}</UI.Etiqueta>
                <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 min-h-0">
                  {items.filter(i => i.pedido_id === pedidoActivo.id).map(item => {
                    const variante = variantes.find(v => v.id === item.variante_id) || {};
                    const producto = productos.find(p => p.id === variante.producto_id) || {};
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: tema.texto + '11', background: tema.fondo }}>
                        {producto.imagen_principal ? (
                          <img src={producto.imagen_principal} alt={producto.nombre} className="w-12 h-12 rounded-md object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-md flex items-center justify-center bg-black/5"><Iconos.Image size={20} color={tema.texto} opacity={0.3} /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate" style={{ color: tema.texto }}>{producto.nombre || MEITI.t('unknown_product', null, 'Producto Desconocido')}</p>
                          <p className="text-xs opacity-70" style={{ color: tema.texto }}>SKU: {variante.sku || '---'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold" style={{ color: tema.texto }}>{item.cantidad}x</p>
                          <p className="text-sm" style={{ color: tema.colorSecundario }}>${(item.precio_unitario * item.cantidad).toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-auto pt-4 border-t flex justify-between items-center" style={{ borderColor: tema.texto + '22' }}>
                  <span className="font-bold text-lg" style={{ color: tema.texto }}>{MEITI.t('lbl_total', null, 'Total Pagado:')}</span>
                  <span className="font-black text-2xl" style={{ color: tema.colorPrimario }}>${pedidoActivo.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </UI.Tarjeta>
        </Animacion.motion.div>
      )}
    </div>
  );
}