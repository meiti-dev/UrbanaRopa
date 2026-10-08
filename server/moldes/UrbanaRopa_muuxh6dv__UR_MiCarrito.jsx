/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  
  const [carrito, setCarrito] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [talles, setTalles] = useState([]);
  const [colores, setColores] = useState([]);
  const [precios, setPrecios] = useState([]);
  
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    setCargando(true);
    const [resCart, resVar, resProd, resTal, resCol, resPrecios] = await Promise.all([
      MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('ur_carrito')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_variantes')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_productos')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_talles')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_colores')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/pagos-conectados/${eco}/precios`)
    ]);

    if (resCart.ok) setCarrito(resCart.registros || []);
    if (resVar.ok) setVariantes(resVar.registros || []);
    if (resProd.ok) setProductos(resProd.registros || []);
    if (resTal.ok) setTalles(resTal.registros || []);
    if (resCol.ok) setColores(resCol.registros || []);
    if (resPrecios.ok) setPrecios(resPrecios.registros || []);
    
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const borrarItem = async (id) => {
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('ur_carrito')}?ecosistema=${eco}&id=${id}`, { method: 'DELETE' }, {
      alLograr: cargar,
      alFallar: setError
    });
  };

  const calcularTotal = () => {
    return carrito.reduce((acc, item) => {
      const v = variantes.find(x => x.id === item.variante_id);
      if (!v) return acc;
      const p = precios.find(x => x.item_id === v.producto_id);
      const precio = p ? (p.monto_centavos / 100) : 0;
      return acc + (precio * item.cantidad);
    }, 0);
  };

  const total = calcularTotal();

  if (cargando) return <div className="p-12 text-center"><Iconos.LoaderCircle size={48} className="animate-spin mx-auto" color={tema.colorPrimario} /></div>;

  return (
    <div className="flex flex-col gap-8 pb-32">
      <h1 className="font-serif text-4xl tracking-tight" style={{ color: tema.texto }}>{MEITI.t('my_cart_title', null, 'Mi Carrito')}</h1>
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />

      {carrito.length === 0 ? (
        <UI.EstadoVacio icono="fa-basket-shopping" mensaje={MEITI.t('empty_cart_msg', null, 'Tu carrito está vacío. ¡Descubre nuestra colección!')} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {carrito.map(item => {
              const v = variantes.find(x => x.id === item.variante_id) || {};
              const prod = productos.find(x => x.id === v.producto_id) || {};
              const talle = talles.find(x => x.id === v.talle_id) || {};
              const color = colores.find(x => x.id === v.color_id) || {};
              const pr = precios.find(x => x.item_id === v.producto_id);
              const precioUnitario = pr ? (pr.monto_centavos / 100) : 0;

              return (
                <UI.Tarjeta key={item.id} className="p-4 rounded-3xl flex gap-4 items-center">
                  <div className="w-24 h-24 rounded-2xl bg-black/5 overflow-hidden flex-shrink-0">
                    {prod.imagen_principal && <img src={prod.imagen_principal} alt={prod.nombre} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <span className="font-serif text-lg font-bold" style={{ color: tema.texto }}>{prod.nombre || MEITI.t('product_fallback', null, 'Producto')}</span>
                    <span className="text-sm opacity-70" style={{ color: tema.texto }}>{MEITI.t('size_label', null, 'Talle')}: {talle.nombre} | {MEITI.t('color_label', null, 'Color')}: {color.nombre}</span>
                    <span className="font-mono font-bold mt-2" style={{ color: tema.colorPrimario }}>${(precioUnitario * item.cantidad).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="px-4 py-2 rounded-xl font-bold" style={{ background: tema.superficie, color: tema.texto }}>
                      {item.cantidad} {MEITI.t('units_abbr', null, 'un.')}
                    </div>
                    <button onClick={() => borrarItem(item.id)} className="text-sm font-bold opacity-50 hover:opacity-100 transition-opacity" style={{ color: '#ef4444' }}>
                      {MEITI.t('remove_btn', null, 'Quitar')}
                    </button>
                  </div>
                </UI.Tarjeta>
              );
            })}
          </div>

          <div className="flex flex-col gap-6">
            <UI.Tarjeta className="p-6 rounded-3xl flex flex-col gap-4">
              <h3 className="font-serif text-xl font-bold" style={{ color: tema.texto }}>{MEITI.t('summary_title', null, 'Resumen')}</h3>
              <div className="flex justify-between items-center opacity-70" style={{ color: tema.texto }}>
                <span>{MEITI.t('subtotal_label', { count: carrito.length }, 'Subtotal ({count} items)')}</span>
                <span className="font-mono">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center opacity-70" style={{ color: tema.texto }}>
                <span>{MEITI.t('shipping_label', null, 'Envío')}</span>
                <span>{MEITI.t('to_calculate_label', null, 'A calcular')}</span>
              </div>
              <div className="h-px w-full opacity-10" style={{ background: tema.texto }} />
              <div className="flex justify-between items-center text-2xl font-black" style={{ color: tema.texto }}>
                <span>{MEITI.t('total_label', null, 'Total')}</span>
                <span className="font-mono">${total.toFixed(2)}</span>
              </div>
            </UI.Tarjeta>

            <button 
              onClick={() => MEITI.irAPagina('checkout')}
              className="w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-xl"
              style={{ background: tema.colorPrimario, color: '#fff' }}
            >
              {MEITI.t('continue_shopping_btn', null, 'Continuar Compra')} <Iconos.ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}