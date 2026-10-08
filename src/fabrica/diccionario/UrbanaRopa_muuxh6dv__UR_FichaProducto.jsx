import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const UrbanaRopa_muuxh6dv__UR_FichaProducto = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  
  const [producto, setProducto] = useState(null);
  const [variantes, setVariantes] = useState([]);
  const [talles, setTalles] = useState([]);
  const [colores, setColores] = useState([]);
  const [precio, setPrecio] = useState(null);
  
  const [talleSel, setTalleSel] = useState(null);
  const [colorSel, setColorSel] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      const resEstado = await MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('ur_estado_sesion')}?ecosistema=${eco}`);
      if (!resEstado.ok || resEstado.registros.length === 0 || !resEstado.registros[0].producto_activo_id) {
        MEITI.irAPagina('tienda');
        return;
      }
      const prodId = resEstado.registros[0].producto_activo_id;

      const [resProd, resVar, resTal, resCol, resPrecios] = await Promise.all([
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_productos')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_variantes')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_talles')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_colores')}?ecosistema=${eco}`),
        MEITI.fetchObjeto(`/api/pagos-conectados/${eco}/precios`)
      ]);

      if (resProd.ok) {
        const p = resProd.registros.find(x => x.id === prodId);
        if (p) setProducto(p);
        else MEITI.irAPagina('tienda');
      }
      if (resVar.ok) setVariantes(resVar.registros.filter(v => v.producto_id === prodId));
      if (resTal.ok) setTalles(resTal.registros.sort((a,b) => (a.orden||0)-(b.orden||0)));
      if (resCol.ok) setColores(resCol.registros.sort((a,b) => (a.orden||0)-(b.orden||0)));
      if (resPrecios.ok) {
        const pr = (resPrecios.data || []).find(x => x.item_id === prodId);
        if (pr) setPrecio((pr.monto_centavos / 100).toFixed(2));
      }
      setCargando(false);
    };
    cargar();
  }, []);

  const varianteActiva = variantes.find(v => v.talle_id === talleSel && v.color_id === colorSel);
  const stockDisponible = varianteActiva ? Number(varianteActiva.stock) : 0;

  const agregarAlCarrito = async () => {
    if (!varianteActiva) return setError('Selecciona un talle y color válidos.');
    if (stockDisponible < cantidad) return setError('No hay suficiente stock.');
    
    setAgregando(true);
    setError(null);
    setExito(null);

    const payload = {
      id: 'cart_' + Date.now(),
      usuario_id: miId,
      variante_id: varianteActiva.id,
      cantidad: cantidad,
      fecha_registro: new Date().toISOString()
    };

    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('ur_carrito')}?ecosistema=${eco}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito('¡Agregado al carrito!');
        setAgregando(false);
        setTimeout(() => setExito(null), 3000);
      },
      alFallar: (err) => {
        setError(err || 'Error al agregar al carrito');
        setAgregando(false);
      }
    });
  };

  if (cargando) return <div className="p-12 text-center"><Iconos.LoaderCircle size={48} className="animate-spin mx-auto" color={tema.colorPrimario} /></div>;
  if (!producto) return null;

  const tallesDisponibles = talles.filter(t => variantes.some(v => v.talle_id === t.id));
  const coloresDisponibles = colores.filter(c => variantes.some(v => v.color_id === c.id && (!talleSel || v.talle_id === talleSel)));

  return (
    <div className="flex flex-col gap-8 pb-24">
      <button onClick={() => MEITI.irAPagina('tienda')} className="flex items-center gap-2 font-bold w-fit" style={{ color: tema.texto, opacity: 0.7 }}>
        <Iconos.ArrowLeft size={20} /> Volver a la tienda
      </button>

      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="w-full aspect-[3/4] md:aspect-square rounded-3xl overflow-hidden bg-black/5">
          {producto.imagen_principal ? (
            <img src={producto.imagen_principal} alt={producto.nombre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Iconos.Image size={64} color={tema.texto} className="opacity-20" /></div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-serif text-4xl tracking-tight mb-2" style={{ color: tema.texto }}>{producto.nombre}</h1>
            <span className="font-mono text-3xl font-bold" style={{ color: tema.colorPrimario }}>
              {precio ? `$${precio}` : <span className="text-lg opacity-50">Precio no configurado</span>}
            </span>
          </div>

          <p className="text-lg leading-relaxed opacity-80" style={{ color: tema.texto }}>{producto.descripcion}</p>

          <div className="flex flex-col gap-3">
            <span className="font-bold uppercase tracking-wider text-sm" style={{ color: tema.texto }}>Talle</span>
            <div className="flex flex-wrap gap-3">
              {tallesDisponibles.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTalleSel(t.id); setColorSel(null); }}
                  className="w-14 h-14 rounded-2xl font-bold text-lg transition-all border-2"
                  style={{ 
                    background: talleSel === t.id ? tema.colorPrimario : tema.superficie, 
                    color: talleSel === t.id ? '#fff' : tema.texto,
                    borderColor: talleSel === t.id ? tema.colorPrimario : tema.texto + '22'
                  }}
                >
                  {t.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-bold uppercase tracking-wider text-sm" style={{ color: tema.texto }}>Color</span>
            <div className="flex flex-wrap gap-3">
              {coloresDisponibles.map(c => (
                <button
                  key={c.id}
                  onClick={() => setColorSel(c.id)}
                  className="w-14 h-14 rounded-2xl transition-all border-2 flex items-center justify-center"
                  style={{ 
                    background: c.hex || tema.superficie,
                    borderColor: colorSel === c.id ? tema.colorPrimario : 'transparent',
                    boxShadow: colorSel === c.id ? `0 0 0 2px ${tema.fondo}, 0 0 0 4px ${tema.colorPrimario}` : 'none'
                  }}
                  title={c.nombre}
                >
                  {colorSel === c.id && <Iconos.Check size={24} color={c.hex === '#FFFFFF' || c.hex === '#ffffff' ? '#000' : '#fff'} />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-bold uppercase tracking-wider text-sm" style={{ color: tema.texto }}>Cantidad</span>
            <div className="flex items-center gap-6 p-2 rounded-2xl w-fit" style={{ background: tema.superficie }}>
              <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="p-3 rounded-xl hover:bg-black/5" style={{ color: tema.texto }}><Iconos.Minus size={20} /></button>
              <span className="text-xl font-bold w-8 text-center" style={{ color: tema.texto }}>{cantidad}</span>
              <button onClick={() => setCantidad(cantidad + 1)} className="p-3 rounded-xl hover:bg-black/5" style={{ color: tema.texto }}><Iconos.Plus size={20} /></button>
            </div>
            {talleSel && colorSel && (
              <span className="text-sm font-bold" style={{ color: stockDisponible > 0 ? tema.colorSecundario : '#ef4444' }}>
                {stockDisponible > 0 ? `${stockDisponible} disponibles` : 'Sin stock'}
              </span>
            )}
          </div>

          <button 
            onClick={agregarAlCarrito}
            disabled={agregando || !talleSel || !colorSel || stockDisponible === 0 || !precio}
            className="w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 mt-4 transition-transform active:scale-95"
            style={{ 
              background: tema.colorPrimario, 
              color: '#fff', 
              opacity: (agregando || !talleSel || !colorSel || stockDisponible === 0 || !precio) ? 0.5 : 1 
            }}
          >
            <Iconos.ShoppingBag size={24} />
            {agregando ? 'Agregando...' : 'Agregar al Carrito'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UrbanaRopa_muuxh6dv__UR_FichaProducto;
