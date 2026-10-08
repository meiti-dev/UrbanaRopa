import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const UrbanaRopa_muuxh6dv__UR_HistorialPedidos = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      const res = await MEITI.fetchDatosPropios(`/api/boveda/${MEITI.obtenerTabla('ur_pedidos')}?ecosistema=${eco}`);
      if (res.ok) {
        setPedidos(res.registros.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro)));
      } else {
        setError(res.error || 'Error al cargar pedidos');
      }
      setCargando(false);
    };
    cargar();
  }, []);

  const columnas = [
    { clave: 'id', etiqueta: 'Nº Pedido', render: f => <span className="font-mono text-xs opacity-70">{f.id ? f.id.split('_')[1] : ''}</span> },
    { clave: 'fecha_registro', etiqueta: 'Fecha', tipo: 'fecha' },
    { clave: 'total', etiqueta: 'Total', tipo: 'moneda' },
    { clave: 'metodo_pago', etiqueta: 'Pago', render: f => <span className="capitalize">{f.metodo_pago}</span> },
    { clave: 'estado', etiqueta: 'Estado', render: f => (
      <UI.Chip tono={f.estado === 'entregado' ? 'exito' : f.estado === 'cancelado' ? 'peligro' : 'alerta'}>
        {f.estado ? f.estado.toUpperCase() : ''}
      </UI.Chip>
    )}
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-4xl tracking-tight" style={{ color: tema.texto }}>Mis Pedidos</h1>
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />

      <UI.Tarjeta className="p-6 rounded-3xl">
        {cargando ? (
          <div className="p-8 text-center"><i className="fa-solid fa-spinner fa-spin text-3xl" style={{ color: tema.colorPrimario }}></i></div>
        ) : pedidos.length === 0 ? (
          <UI.EstadoVacio icono="fa-box-open" mensaje="Todavía no has realizado ninguna compra." />
        ) : (
          <UI.TablaDatos 
            columnas={columnas} 
            datos={pedidos} 
            claveId="id"
            advertirAccionIncompleta={false}
            accionesExtra={[
              { etiqueta: 'Ver Detalle', icono: 'fa-eye', tono: 'neutro', onClick: () => setError('Detalle en construcción') }
            ]}
          />
        )}
      </UI.Tarjeta>
    </div>
  );
};

export default UrbanaRopa_muuxh6dv__UR_HistorialPedidos;
