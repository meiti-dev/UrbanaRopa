/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const soyAdmin = MEITI.soyDuenoDeLaApp() || MEITI.miRolEnLaApp() === 'admin';

  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resVar, resProd, resTal, resCol] = await Promise.all([
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_variantes')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_productos')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_talles')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_colores')}?ecosistema=${eco}`)
      ]);

      if (resVar.ok && resProd.ok) {
        const variantes = resVar.registros || [];
        const productos = resProd.registros || [];
        const talles = resTal.registros || [];
        const colores = resCol.registros || [];

        const criticos = variantes
          .filter(v => Number(v.stock) <= 5)
          .map(v => {
            const prod = productos.find(p => p.id === v.producto_id) || {};
            const talle = talles.find(t => t.id === v.talle_id) || {};
            const color = colores.find(c => c.id === v.color_id) || {};
            return {
              ...v,
              producto_nombre: prod.nombre || MEITI.t('unknown_prod', null, 'Producto Desconocido'),
              talle_nombre: talle.nombre || '---',
              color_nombre: color.nombre || '---',
              color_hex: color.hex || '#ccc',
              imagen: prod.imagen_principal
            };
          })
          .sort((a, b) => Number(a.stock) - Number(b.stock));

        setAlertas(criticos);
      } else {
        setError(MEITI.t('err_load_alerts', null, 'No se pudieron cargar las alertas de stock.'));
      }
    } catch (err) {
      setError(MEITI.t('err_general_alerts', null, 'Error al procesar las alertas.'));
    }
    setCargando(false);
  };

  useEffect(() => {
    if (soyAdmin) cargarDatos();
    
    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, [soyAdmin]);

  if (!soyAdmin) return null;

  if (cargando && alertas.length === 0) {
    return (
      <UI.Tarjeta>
        <div className="p-6 text-center flex flex-col items-center gap-3">
          <Iconos.LoaderCircle className="animate-spin" size={32} color={tema.colorPrimario} />
          <span style={{ color: tema.texto }}>{MEITI.t('loading_alerts', null, 'Revisando existencias...')}</span>
        </div>
      </UI.Tarjeta>
    );
  }

  if (alertas.length === 0 && !error) return null;

  return (
    <Animacion.motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <UI.Tarjeta className="flex flex-col gap-4" style={{ border: `1px solid #ef444455` }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-red-100 text-red-600">
            <Iconos.TriangleAlert size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-600">{MEITI.t('title_stock_alerts', null, 'Alertas de Stock Crítico')}</h2>
            <p className="text-sm opacity-80" style={{ color: tema.texto }}>{MEITI.t('desc_stock_alerts', null, 'Artículos con 5 o menos unidades disponibles.')}</p>
          </div>
        </div>

        <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alertas.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: tema.texto + '22', background: tema.fondo }}>
              {a.imagen ? (
                <img src={a.imagen} alt={a.producto_nombre} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-black/5 flex-shrink-0">
                  <Iconos.Package size={20} color={tema.texto} opacity={0.3} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: tema.texto }}>{a.producto_nombre}</p>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-black/5" style={{ color: tema.texto }}>{a.talle_nombre}</span>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/5">
                    <div className="w-2 h-2 rounded-full" style={{ background: a.color_hex }}></div>
                    <span style={{ color: tema.texto }}>{a.color_nombre}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center px-3 py-1 rounded-lg" style={{ background: Number(a.stock) === 0 ? '#ef444422' : '#f59e0b22' }}>
                <span className="text-xs font-bold uppercase" style={{ color: Number(a.stock) === 0 ? '#ef4444' : '#f59e0b' }}>{MEITI.t('lbl_stock', null, 'Stock')}</span>
                <span className="text-xl font-black" style={{ color: Number(a.stock) === 0 ? '#ef4444' : '#f59e0b' }}>{a.stock}</span>
              </div>
            </div>
          ))}
        </div>
      </UI.Tarjeta>
    </Animacion.motion.div>
  );
}