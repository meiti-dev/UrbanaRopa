import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const UrbanaRopa_muuxh6dv__UR_GestorEstadosPedido = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const soyAdmin = MEITI.soyDuenoDeLaApp() || MEITI.miRolEnLaApp() === 'admin';

  const [estados, setEstados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  
  const vacio = { id: '', nombre: '', color: 'neutro', orden: '0' };
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    const res = await MEITI.fetchDatos(`http://localhost:4001/api/boveda/${MEITI.obtenerTabla('ur_estados_pedido')}?ecosistema=${eco}`);
    if (res.ok) {
      setEstados(res.registros.sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0)));
    } else {
      setError(MEITI.t('err_load_statuses', null, 'Error al cargar los estados de pedido.'));
    }
    setCargando(false);
  };

  useEffect(() => {
    if (soyAdmin) cargarDatos();
  }, [soyAdmin]);

  if (!soyAdmin) {
    return <UI.Aviso tono="alerta" mensaje={MEITI.t('admin_only', null, 'Esta sección es solo para administradores.')} />;
  }

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return setError(MEITI.t('err_name_req', null, 'El nombre del estado es obligatorio.'));
    setGuardando(true);
    setError(null);
    setExito(null);

    const payload = {
      id: form.id || 'est_' + Date.now(),
      nombre: form.nombre.trim(),
      color: form.color,
      orden: Number(form.orden) || 0
    };

    await MEITI.mutar(`http://localhost:4001/api/boveda/${MEITI.obtenerTabla('ur_estados_pedido')}?ecosistema=${eco}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('msg_status_saved', null, 'Estado guardado correctamente.'));
        setForm(vacio);
        cargarDatos();
        setGuardando(false);
      },
      alFallar: (err) => {
        setError(err || MEITI.t('err_save_status', null, 'Error al guardar el estado.'));
        setGuardando(false);
      }
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('q_delete_status', null, '¿Borrar este estado?'), { titulo: MEITI.t('delete', null, 'Borrar'), confirmar: MEITI.t('delete_yes', null, 'Sí, borrar'), tono: 'peligro' })) return;
    await MEITI.mutar(`http://localhost:4001/api/boveda/${MEITI.obtenerTabla('ur_estados_pedido')}?ecosistema=${eco}&id=${id}`, {
      method: 'DELETE'
    }, {
      alLograr: cargarDatos,
      alFallar: setError
    });
  };

  const columnas = [
    { clave: 'orden', etiqueta: MEITI.t('col_order', null, 'Orden'), tipo: 'numero' },
    { clave: 'nombre', etiqueta: MEITI.t('col_name', null, 'Nombre') },
    { clave: 'color', etiqueta: MEITI.t('col_color', null, 'Color'), render: f => <UI.Chip tono={f.color}>{MEITI.t(`color_${f.color}`, null, f.color)}</UI.Chip> }
  ];

  const opcionesColor = [
    { value: 'neutro', label: MEITI.t('color_neutro', null, 'Gris (Neutro)') },
    { value: 'primario', label: MEITI.t('color_primario', null, 'Primario') },
    { value: 'secundario', label: MEITI.t('color_secundario', null, 'Secundario') },
    { value: 'exito', label: MEITI.t('color_exito', null, 'Verde (Éxito)') },
    { value: 'alerta', label: MEITI.t('color_alerta', null, 'Amarillo (Alerta)') },
    { value: 'peligro', label: MEITI.t('color_peligro', null, 'Rojo (Peligro)') }
  ];

  return (
    <UI.Tarjeta className="flex flex-col gap-6 mt-6 flex-1 min-h-0">
      <div className="flex items-center gap-3">
        <i className="fa-solid fa-tags text-xl" style={{ color: tema.colorSecundario }}></i>
        <h3 className="text-lg font-bold" style={{ color: tema.texto }}>{MEITI.t('title_manage_statuses', null, 'Configurar Estados de Pedido')}</h3>
      </div>
      
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

      <form onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="flex-1">
          <UI.Campo etiqueta={MEITI.t('lbl_name', null, 'Nombre')} tipo="text" valor={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder={MEITI.t('ph_status_name', null, 'Ej: En Preparación')} />
        </div>
        <div className="flex-1">
          <UI.Campo etiqueta={MEITI.t('lbl_color', null, 'Color')} tipo="select" valor={form.color} onChange={e => setForm({...form, color: e.target.value})} opciones={opcionesColor} />
        </div>
        <div className="flex-1">
          <UI.Campo etiqueta={MEITI.t('lbl_order', null, 'Orden')} tipo="number" valor={form.orden} onChange={e => setForm({...form, orden: e.target.value})} />
        </div>
        <div className="flex-1">
          <UI.Boton tipo="submit" variante="primario" disabled={guardando}>{form.id ? MEITI.t('btn_update', null, 'Actualizar') : MEITI.t('btn_add', null, 'Agregar')}</UI.Boton>
        </div>
      </form>

      {cargando ? (
        <UI.Etiqueta>{MEITI.t('loading', null, 'Cargando...')}</UI.Etiqueta>
      ) : estados.length === 0 ? (
        <UI.EstadoVacio icono="fa-tags" mensaje={MEITI.t('no_statuses', null, 'No hay estados configurados. Agrega el primero arriba.')} />
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0">
          <UI.TablaDatos 
            columnas={columnas} 
            datos={estados} 
            claveId="id" 
            onEditar={f => { setForm({ id: f.id, nombre: f.nombre, color: f.color || 'neutro', orden: String(f.orden||0) }); setError(null); setExito(null); }} 
            onBorrar={f => borrar(f.id)} 
          />
        </div>
      )}
    </UI.Tarjeta>
  );
};

export default UrbanaRopa_muuxh6dv__UR_GestorEstadosPedido;
