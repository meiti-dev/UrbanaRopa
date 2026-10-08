/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [catActiva, setCatActiva] = useState('todas');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      const [resProd, resCat, resPrecios] = await Promise.all([
        MEITI.fetchDatos(`http://localhost:4001/api/boveda/${MEITI.obtenerTabla('ur_productos')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`http://localhost:4001/api/boveda/${MEITI.obtenerTabla('ur_categorias')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`http://localhost:4001/api/pagos-conectados/${eco}/precios`)
      ]);

      if (resProd.ok) setProductos(resProd.registros.filter(p => p.estado === 'activo'));
      if (resCat.ok) setCategorias(resCat.registros.sort((a, b) => (a.orden || 0) - (b.orden || 0)));
      if (resPrecios.ok) setPrecios(resPrecios.registros || []);
      
      setCargando(false);
    };
    cargar();
  }, []);

  const verDetalle = async (prodId) => {
    const urlEstado = `http://localhost:4001/api/boveda/${MEITI.obtenerTabla('ur_estado_sesion')}?ecosistema=${eco}`;
    await MEITI.mutar(urlEstado, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: miId, usuario_id: miId, producto_activo_id: prodId, fecha_actualizacion: new Date().toISOString() })
    }, {
      alLograr: () => MEITI.irAPagina('detalle_producto'),
      alFallar: (err) => setError(err || 'Error al abrir el producto')
    });
  };

  const obtenerPrecio = (id) => {
    const p = precios.find(x => x.item_id === id);
    return p ? (p.monto_centavos / 100).toFixed(2) : null;
  };

  const prodsFiltrados = catActiva === 'todas' ? productos : productos.filter(p => p.categoria_id === catActiva);

  return (
    <div className="flex flex-col gap-8">
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl tracking-tight" style={{ color: tema.texto }}>Colección Urbana</h1>
        <p className="opacity-70" style={{ color: tema.texto }}>Descubre las últimas tendencias.</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
        <button
          onClick={() => setCatActiva('todas')}
          className="snap-start whitespace-nowrap px-6 py-2 rounded-full font-bold transition-colors"
          style={{ background: catActiva === 'todas' ? tema.colorPrimario : tema.superficie, color: catActiva === 'todas' ? '#fff' : tema.texto }}
        >
          Todas
        </button>
        {categorias.map(c => (
          <button
            key={c.id}
            onClick={() => setCatActiva(c.id)}
            className="snap-start whitespace-nowrap px-6 py-2 rounded-full font-bold transition-colors"
            style={{ background: catActiva === c.id ? tema.colorPrimario : tema.superficie, color: catActiva === c.id ? '#fff' : tema.texto }}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="p-12 text-center"><Iconos.LoaderCircle size={48} className="animate-spin mx-auto" color={tema.colorPrimario} /></div>
      ) : prodsFiltrados.length === 0 ? (
        <UI.EstadoVacio icono="fa-shirt" mensaje="No hay prendas en esta categoría por el momento." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prodsFiltrados.map(p => {
            const precio = obtenerPrecio(p.id);
            return (
              <Animacion.motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <UI.Tarjeta className="p-4 rounded-3xl cursor-pointer hover:shadow-xl transition-shadow h-full flex flex-col" onClick={() => verDetalle(p.id)}>
                  <div className="w-full aspect-[4/3] rounded-2xl bg-black/5 mb-4 overflow-hidden relative">
                    {p.imagen_principal ? (
                      <img src={p.imagen_principal} alt={p.nombre} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Iconos.Image size={48} color={tema.texto} className="opacity-20" /></div>
                    )}
                    {p.destacado === 1 && (
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: tema.colorSecundario, color: '#fff' }}>
                        Nuevo
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif text-xl leading-tight" style={{ color: tema.texto }}>{p.nombre}</h3>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="font-mono font-bold text-lg" style={{ color: tema.colorPrimario }}>
                      {precio ? `$${precio}` : <span className="text-sm opacity-50">Consultar</span>}
                    </span>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: tema.superficie, color: tema.texto }}>
                      <Iconos.ArrowRight size={18} />
                    </div>
                  </div>
                </UI.Tarjeta>
              </Animacion.motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}