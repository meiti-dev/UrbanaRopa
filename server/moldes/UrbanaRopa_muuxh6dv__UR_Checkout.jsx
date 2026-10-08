/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  
  const [carrito, setCarrito] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [zonas, setZonas] = useState([]);
  
  const [form, setForm] = useState({ zona_id: '', direccion: '', notas: '', metodo_pago: 'tarjeta' });
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      const [resCart, resVar, resPrecios, resZonas] = await Promise.all([
        MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('ur_carrito')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_variantes')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/pagos-conectados/${eco}/precios`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_zonas_envio')}?ecosistema=${eco}`)
      ]);

      if (resCart.ok) setCarrito(resCart.registros || []);
      if (resVar.ok) setVariantes(resVar.registros || []);
      if (resPrecios.ok) setPrecios(resPrecios.registros || []);
      if (resZonas.ok) {
        const z = resZonas.registros || [];
        setZonas(z);
        if (z.length > 0) setForm(f => ({ ...f, zona_id: z[0].id }));
      }
      setCargando(false);
    };
    cargar();
  }, []);

  const subtotal = carrito.reduce((acc, item) => {
    const v = variantes.find(x => x.id === item.variante_id);
    if (!v) return acc;
    const p = precios.find(x => x.item_id === v.producto_id);
    return acc + (p ? (p.monto_centavos / 100) : 0) * item.cantidad;
  }, 0);

  const zonaSel = zonas.find(z => z.id === form.zona_id);
  const costoEnvio = zonaSel ? Number(zonaSel.costo) : 0;
  const total = subtotal + costoEnvio;

  const procesarPedidoManual = async () => {
    const pedidoId = 'ped_' + Date.now();
    const mutaciones = [
      {
        url: `/api/boveda/${MEITI.obtenerTabla('ur_pedidos')}?ecosistema=${eco}`,
        opciones: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: pedidoId,
            usuario_id: miId,
            estado: 'pendiente',
            total: total,
            metodo_pago: form.metodo_pago,
            zona_envio_id: form.zona_id,
            direccion_envio: form.direccion.trim(),
            notas: form.notas.trim(),
            fecha_registro: new Date().toISOString()
          })
        }
      },
      ...carrito.map(item => {
        const v = variantes.find(x => x.id === item.variante_id);
        const p = precios.find(x => x.item_id === v?.producto_id);
        return {
          url: `/api/boveda/${MEITI.obtenerTabla('ur_pedido_items')}?ecosistema=${eco}`,
          opciones: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: 'pitem_' + Date.now() + Math.random().toString(36).substring(7),
              pedido_id: pedidoId,
              variante_id: item.variante_id,
              cantidad: item.cantidad,
              precio_unitario: p ? (p.monto_centavos / 100) : 0
            })
          }
        };
      }),
      ...carrito.map(item => ({
        url: `/api/boveda/${MEITI.obtenerTabla('ur_carrito')}?ecosistema=${eco}&id=${item.id}`,
        opciones: { method: 'DELETE' }
      }))
    ];

    await MEITI.mutarVarias(mutaciones, {
      alLograr: () => {
        setExito('¡Pedido registrado con éxito!');
        setProcesando(false);
        setTimeout(() => MEITI.irAPagina('mis_pedidos'), 3000);
      },
      alFallar: (err) => {
        setError(err || 'Error al procesar el pedido');
        setProcesando(false);
      }
    });
  };

  const confirmar = async () => {
    if (!form.direccion.trim()) return setError('Ingresa una dirección de entrega.');
    if (!form.zona_id) return setError('Selecciona una zona de envío.');
    
    setProcesando(true);
    setError(null);

    if (form.metodo_pago === 'tarjeta') {
      const v = variantes.find(x => x.id === carrito[0].variante_id);
      const res = await MEITI.fetchMutante(`/api/pagos-conectados/${eco}/comprar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: v.producto_id,
          usuario_id: miId,
          url_exito: window.location.origin,
          url_cancelado: window.location.href
        })
      });

      if (!res.ok) {
        setError(res.error || 'El administrador aún no configuró los pagos online. Por favor, elige Transferencia o Efectivo.');
        setProcesando(false);
        return;
      }
      MEITI.abrirEnlaceExterno(res.data.url);
    } else {
      await procesarPedidoManual();
    }
  };

  if (cargando) return <div className="p-12 text-center"><Iconos.LoaderCircle size={48} className="animate-spin mx-auto" color={tema.colorPrimario} /></div>;
  if (carrito.length === 0 && !exito) return <UI.EstadoVacio icono="fa-basket-shopping" mensaje="No hay nada que pagar." />;

  if (exito) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
        <Animacion.motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: tema.colorSecundario, color: '#fff' }}>
          <Iconos.CheckCheck size={48} />
        </Animacion.motion.div>
        <h2 className="font-serif text-4xl" style={{ color: tema.texto }}>{exito}</h2>
        <p className="opacity-70" style={{ color: tema.texto }}>Te redirigiremos a tus pedidos en breve...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-24">
      <h1 className="font-serif text-4xl tracking-tight" style={{ color: tema.texto }}>Finalizar Pedido</h1>
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <UI.Tarjeta className="p-6 rounded-3xl flex flex-col gap-4">
            <h3 className="font-serif text-2xl font-bold" style={{ color: tema.texto }}>1. Entrega</h3>
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <UI.Campo 
                  etiqueta="Zona de Envío"
                  tipo="select"
                  valor={form.zona_id}
                  onChange={e => setForm({...form, zona_id: e.target.value})}
                  opciones={zonas.map(z => ({ value: z.id, label: `${z.nombre} (+$${z.costo})` }))}
                />
              </div>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta="Dirección Completa"
                  tipo="text"
                  valor={form.direccion}
                  onChange={e => setForm({...form, direccion: e.target.value})}
                  placeholder="Calle, Número, Piso, Depto, Ciudad"
                />
              </div>
              <div className="flex-1">
                <UI.Campo 
                  etiqueta="Notas para el envío (opcional)"
                  tipo="textarea"
                  valor={form.notas}
                  onChange={e => setForm({...form, notas: e.target.value})}
                  placeholder="Ej: Tocar timbre fuerte, dejar en portería..."
                />
              </div>
            </div>
          </UI.Tarjeta>

          <UI.Tarjeta className="p-6 rounded-3xl flex flex-col gap-4">
            <h3 className="font-serif text-2xl font-bold" style={{ color: tema.texto }}>2. Pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[ 
                { id: 'tarjeta', label: 'Tarjeta (Online)', icon: <Iconos.CreditCard size={24} /> },
                { id: 'transferencia', label: 'Transferencia', icon: <Iconos.Landmark size={24} /> },
                { id: 'efectivo', label: 'Contra Entrega', icon: <Iconos.Banknote size={24} /> }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setForm({...form, metodo_pago: m.id})}
                  className="p-4 rounded-2xl flex flex-col items-center gap-3 transition-all border-2"
                  style={{ 
                    background: form.metodo_pago === m.id ? tema.colorPrimario : tema.superficie,
                    color: form.metodo_pago === m.id ? '#fff' : tema.texto,
                    borderColor: form.metodo_pago === m.id ? tema.colorPrimario : tema.texto + '22'
                  }}
                >
                  {m.icon}
                  <span className="font-bold text-sm text-center">{m.label}</span>
                </button>
              ))}
            </div>
          </UI.Tarjeta>
        </div>

        <div className="flex flex-col gap-6">
          <UI.Tarjeta className="p-6 rounded-3xl flex flex-col gap-4">
            <h3 className="font-serif text-2xl font-bold" style={{ color: tema.texto }}>Resumen Final</h3>
            <div className="flex flex-col gap-3 opacity-80" style={{ color: tema.texto }}>
              <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Envío ({zonaSel?.nombre || '...'})</span><span className="font-mono">${costoEnvio.toFixed(2)}</span></div>
            </div>
            <div className="h-px w-full opacity-10 my-2" style={{ background: tema.texto }} />
            <div className="flex justify-between items-center text-3xl font-black" style={{ color: tema.texto }}>
              <span>Total</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </div>
          </UI.Tarjeta>

          <button 
            onClick={confirmar}
            disabled={procesando}
            className="w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-xl"
            style={{ background: tema.colorSecundario, color: '#fff', opacity: procesando ? 0.7 : 1 }}
          >
            {procesando ? <Iconos.LoaderCircle size={24} className="animate-spin" /> : <Iconos.CheckCircle size={24} />}
            {procesando ? 'Procesando...' : 'Confirmar y Pagar'}
          </button>
        </div>
      </div>
    </div>
  );
}