import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const UrbanaRopa_muuxh6dv__UR_GestorCatalogosBase = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const soyAdmin = MEITI.soyDuenoDeLaApp() || MEITI.miRolEnLaApp() === 'admin';

  const [pestana, setPestana] = useState('categorias');
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const vacio = { id: '', nombre: '', orden: '0', hex: '#000000' };
  const [form, setForm] = useState(vacio);

  const getTabla = () => {
    if (pestana === 'categorias') return MEITI.obtenerTabla('ur_categorias');
    if (pestana === 'talles') return MEITI.obtenerTabla('ur_talles');
    return MEITI.obtenerTabla('ur_colores');
  };

  const cargar = async () => {
    setCargando(true);
    const res = await MEITI.fetchDatos(`/api/boveda/${getTabla()}?ecosistema=${eco}`);
    if (res.ok) setRegistros(res.registros.sort((a,b) => (a.orden||0) - (b.orden||0)));
    else setError(MEITI.t('err_load_catalogs', null, 'Error al cargar los datos del catálogo.'));
    setCargando(false);
  };

  useEffect(() => {
    if (soyAdmin) cargar();
    setForm(vacio);
    setError(null);
    setExito(null);
  }, [pestana, soyAdmin]);

  if (!soyAdmin) return <UI.Aviso tono="peligro" mensaje={MEITI.t('admin_only', null, 'Acceso denegado. Solo administradores.')} />;

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return setError(MEITI.t('err_name_req', null, 'El nombre es obligatorio.'));
    setGuardando(true);
    setError(null);
    setExito(null);

    const payload = {
      id: form.id || `${pestana}_${Date.now()}`,
      nombre: form.nombre.trim(),
      orden: Number(form.orden) || 0
    };
    if (pestana === 'colores') payload.hex = form.hex;

    await MEITI.mutar(`/api/boveda/${getTabla()}?ecosistema=${eco}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('msg_saved_catalog', null, 'Registro guardado correctamente.'));
        setForm(vacio);
        cargar();
        setGuardando(false);
      },
      alFallar: (err) => {
        setError(err || MEITI.t('err_save_catalog', null, 'Error al guardar el registro.'));
        setGuardando(false);
      }
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('q_delete_catalog', null, '¿Borrar este registro del catálogo?'))) return;
    await MEITI.mutar(`/api/boveda/${getTabla()}?ecosistema=${eco}&id=${id}`, {
      method: 'DELETE'
    }, {
      alLograr: cargar,
      alFallar: setError
    });
  };

  const columnas = [
    { clave: 'orden', etiqueta: MEITI.t('col_order', null, 'Orden'), tipo: 'numero' },
    { clave: 'nombre', etiqueta: MEITI.t('col_name', null, 'Nombre') }
  ];
  if (pestana === 'colores') {
    columnas.push({
      clave: 'hex',
      etiqueta: MEITI.t('col_color_hex', null, 'Color'),
      render: f => (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{background: f.hex}}></div>
          <span className="font-mono text-xs opacity-80">{f.hex}</span>
        </div>
      )
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <UI.Pestanas pestanas={[
        {id: 'categorias', titulo: MEITI.t('tab_categories', null, 'Categorías'), icono: 'fa-tags'},
        {id: 'talles', titulo: MEITI.t('tab_sizes', null, 'Talles'), icono: 'fa-ruler'},
        {id: 'colores', titulo: MEITI.t('tab_colors', null, 'Colores'), icono: 'fa-palette'}
      ]} activa={pestana} onCambio={setPestana} />

      <Animacion.motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{duration: 0.3}} key={pestana}>
        <UI.Tarjeta className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b pb-3" style={{borderColor: tema.texto + '22'}}>
            <Iconos.Settings2 size={20} color={tema.colorPrimario} />
            <h3 className="text-lg font-bold" style={{color: tema.texto}}>
              {form.id ? MEITI.t('title_edit_catalog', null, 'Editar Registro') : MEITI.t('title_new_catalog', null, 'Nuevo Registro')}
            </h3>
          </div>
          
          <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
          <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

          <form onSubmit={guardar} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('lbl_name', null, 'Nombre')} tipo="text" valor={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder={MEITI.t('ph_name_catalog', null, 'Ej: Remeras, XL, Rojo...')} />
              </div>
              <div className="flex-1">
                <UI.Campo etiqueta={MEITI.t('lbl_order', null, 'Orden de aparición')} tipo="number" valor={form.orden} onChange={e => setForm({...form, orden: e.target.value})} />
              </div>
              {pestana === 'colores' && (
                <div className="flex-1">
                  <UI.Campo etiqueta={MEITI.t('lbl_hex', null, 'Código Hexadecimal')} tipo="text" valor={form.hex} onChange={e => setForm({...form, hex: e.target.value})} placeholder="#FF0000" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-2">
              <UI.Boton tipo="submit" variante="primario" disabled={guardando}>
                <span className="flex items-center gap-2">
                  {guardando ? <Iconos.LoaderCircle size={18} className="animate-spin" /> : <Iconos.Save size={18} />}
                  {form.id ? MEITI.t('btn_update', null, 'Actualizar') : MEITI.t('btn_add', null, 'Agregar')}
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
          ) : registros.length === 0 ? (
            <UI.EstadoVacio icono="fa-box-open" mensaje={MEITI.t('no_records_catalog', null, 'No hay registros en este catálogo todavía.')} />
          ) : (
            <UI.TablaDatos 
              columnas={columnas} 
              datos={registros} 
              claveId="id" 
              onEditar={f => setForm({id: f.id, nombre: f.nombre, orden: String(f.orden||0), hex: f.hex||'#000000'})} 
              onBorrar={f => borrar(f.id)} 
            />
          )}
        </UI.Tarjeta>
      </Animacion.motion.div>
    </div>
  );
};

export default UrbanaRopa_muuxh6dv__UR_GestorCatalogosBase;
