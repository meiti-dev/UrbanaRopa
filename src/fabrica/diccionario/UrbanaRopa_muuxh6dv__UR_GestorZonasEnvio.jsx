import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const UrbanaRopa_muuxh6dv__UR_GestorZonasEnvio = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const soyAdmin = MEITI.soyDuenoDeLaApp() || MEITI.miRolEnLaApp() === 'admin';

  const [zonas, setZonas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const vacio = { id: '', nombre: '', costo: '', tiempo_estimado: '' };
  const [form, setForm] = useState(vacio);

  const cargar = async () => {
    setCargando(true);
    const res = await MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('ur_zonas_envio')}?ecosistema=${eco}`);
    if (res.ok) setZonas(res.registros);
    else setError(MEITI.t('err_load_zones', null, 'Error al cargar las zonas de envío.'));
    setCargando(false);
  };

  useEffect(() => {
    if (soyAdmin) cargar();
  }, [soyAdmin]);

  if (!soyAdmin) return null;

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return setError(MEITI.t('err_name_zone_req', null, 'El nombre de la zona es obligatorio.'));
    setGuardando(true);
    setError(null);
    setExito(null);

    const payload = {
      id: form.id || `zona_${Date.now()}`,
      nombre: form.nombre.trim(),
      costo: Number(form.costo) || 0,
      tiempo_estimado: form.tiempo_estimado.trim()
    };

    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('ur_zonas_envio')}?ecosistema=${eco}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('msg_saved_zone', null, 'Zona de envío guardada correctamente.'));
        setForm(vacio);
        cargar();
        setGuardando(false);
      },
      alFallar: (err) => {
        setError(err || MEITI.t('err_save_zone', null, 'Error al guardar la zona.'));
        setGuardando(false);
      }
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('q_delete_zone', null, '¿Borrar esta zona de envío?'))) return;
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('ur_zonas_envio')}?ecosistema=${eco}&id=${id}`, {
      method: 'DELETE'
    }, {
      alLograr: cargar,
      alFallar: setError
    });
  };

  const columnas = [
    { clave: 'nombre', etiqueta: MEITI.t('col_zone_name', null, 'Zona de Envío') },
    { clave: 'costo', etiqueta: MEITI.t('col_zone_cost', null, 'Costo'), tipo: 'moneda' },
    { clave: 'tiempo_estimado', etiqueta: MEITI.t('col_zone_time', null, 'Tiempo Estimado') }
  ];

  return (
    <div className="flex flex-col gap-6 mt-6">
      <Animacion.motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{duration: 0.3}}>
        <UI.Tarjeta className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b pb-3" style={{borderColor: tema.texto + '22'}}>
            <Iconos.Truck size={24} color={tema.colorPrimario} />
            <h2 className="text-xl font-bold" style={{color: tema.texto}}>{MEITI.t('title_shipping_zones', null, 'Zonas y Costos de Envío')}</h2>
          </div>
          
          <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
          <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

          <form onSubmit={guardar} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('lbl_zone_name', null, 'Nombre de la Zona')} tipo="text" valor={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder={MEITI.t('ph_zone_name', null, 'Ej: CABA, GBA Norte...')} />
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('lbl_zone_cost', null, 'Costo de Envío')} tipo="number" valor={form.costo} onChange={e => setForm({...form, costo: e.target.value})} placeholder="0.00" />
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('lbl_zone_time', null, 'Tiempo Estimado')} tipo="text" valor={form.tiempo_estimado} onChange={e => setForm({...form, tiempo_estimado: e.target.value})} placeholder={MEITI.t('ph_zone_time', null, 'Ej: 2 a 3 días hábiles')} />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <UI.Boton tipo="submit" variante="primario" disabled={guardando}>
                <span className="flex items-center gap-2">
                  {guardando ? <Iconos.LoaderCircle size={18} className="animate-spin" /> : <Iconos.Save size={18} />}
                  {form.id ? MEITI.t('btn_update', null, 'Actualizar') : MEITI.t('btn_add', null, 'Agregar Zona')}
                </span>
              </UI.Boton>
              {form.id && (
                <UI.Boton tipo="button" variante="secundario" onClick={() => setForm(vacio)}>
                  <span className="flex items-center gap-2"><Iconos.X size={18} /> {MEITI.t('btn_cancel', null, 'Cancelar')}</span>
                </UI.Boton>
              )}
            </div>
          </form>
        </UI.Tarjeta>
      </Animacion.motion.div>

      <Animacion.motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{duration: 0.3, delay: 0.1}}>
        <UI.Tarjeta>
          {cargando ? (
            <div className="p-8 text-center"><Iconos.LoaderCircle className="animate-spin mx-auto" size={32} color={tema.colorPrimario} /></div>
          ) : zonas.length === 0 ? (
            <UI.EstadoVacio icono="fa-map-location-dot" mensaje={MEITI.t('no_shipping_zones', null, 'No hay zonas de envío configuradas.')} />
          ) : (
            <UI.TablaDatos 
              columnas={columnas} 
              datos={zonas} 
              claveId="id" 
              onEditar={f => setForm({id: f.id, nombre: f.nombre, costo: String(f.costo||0), tiempo_estimado: f.tiempo_estimado||''})} 
              onBorrar={f => borrar(f.id)} 
            />
          )}
        </UI.Tarjeta>
      </Animacion.motion.div>
    </div>
  );
};

export default UrbanaRopa_muuxh6dv__UR_GestorZonasEnvio;
