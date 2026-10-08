/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const soyAdmin = MEITI.miRolEnLaApp() === 'admin' || MEITI.soyDuenoDeLaApp();
  const [estado, setEstado] = React.useState(null);
  const [cargando, setCargando] = React.useState(true);
  const [conectando, setConectando] = React.useState(false);
  const [error, setError] = React.useState(null);


  const cargarEstado = async () => {
    setCargando(true);
    try {
      const r = await MEITI.fetchObjeto(`/api/pagos-conectados/${eco}/estado`);
      if (!r.ok) throw new Error(r.error || 'No se pudo cargar el estado de pagos.');
      setEstado(r.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  React.useEffect(() => { cargarEstado(); }, []);

  const conectar = async () => {
    setConectando(true);
    setError(null);
    try {
      const r = await MEITI.fetchMutante(`/api/pagos-conectados/${eco}/conectar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url_retorno: window.location.href })
      });
      if (!r.ok) throw new Error(r.error || 'No se pudo iniciar la conexión.');
      MEITI.abrirEnlaceExterno(r.data.url);
    } catch (e) {
      setError(e.message);
      setConectando(false);
    }
  };

  if (!soyAdmin) {
    return <UI.Tarjeta><UI.Aviso mensaje={MEITI.t('base_panelconfiguracionpagos_admin_messa', null, "Esta sección es solo para administradores.")} tono="peligro" /></UI.Tarjeta>;
  }
  if (cargando) {
    return (
      <UI.Tarjeta>
        <div className="p-8 text-center">
          <i className="fa-solid fa-spinner fa-spin text-2xl" style={{ color: tema.colorPrimario }}></i>
        </div>
      </UI.Tarjeta>
    );
  }

  return (
    <UI.Tarjeta>
      <div className="p-2 flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-bold" style={{ color: tema.texto }}>{MEITI.t('base_panelconfiguracionpagos_title', null, "Configuración de Pagos")}</h2>
          <p className="text-sm opacity-70 mt-1" style={{ color: tema.texto }}>
            {MEITI.t('base_panelconfiguracionpagos_instruction', null, "Conecta dónde quieres recibir el dinero de lo que se venda dentro de esta aplicación. La verificación la maneja directamente el procesador de pagos — nunca vas a compartir tus datos bancarios acá.")}
          </p>
        </div>

        <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />

        {estado && estado.charges_enabled ? (
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: tema.superficie }}>
              <i className="fa-solid fa-circle-check text-2xl" style={{ color: tema.colorSecundario }}></i>
              <div>
                <div className="font-semibold" style={{ color: tema.texto }}>{MEITI.t('base_panelconfiguracionpagos_status_acti', null, "Pagos activados")}</div>
                <div className="text-sm opacity-70" style={{ color: tema.texto }}>{MEITI.t('base_panelconfiguracionpagos_success_des', null, "Ya puedes vender contenido dentro de esta aplicación.")}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <UI.Chip tono={estado.payouts_enabled ? 'exito' : 'alerta'}>{estado.payouts_enabled ? 'Cobros habilitados' : 'Cobros en revisión'}</UI.Chip>
              <UI.Chip tono={estado.details_submitted ? 'exito' : 'alerta'}>{estado.details_submitted ? 'Datos completos' : 'Datos incompletos'}</UI.Chip>
            </div>
            <UI.Boton variante="secundario" onClick={conectar} disabled={conectando}>{conectando ? 'Abriendo...' : 'Actualizar datos de la cuenta'}</UI.Boton>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-xl" style={{ backgroundColor: tema.superficie }}>
              <div className="font-semibold" style={{ color: tema.texto }}>
                {estado && estado.stripe_account_id ? 'Falta terminar la verificación' : 'Todavía no conectaste una cuenta de pagos'}
              </div>
              <div className="text-sm opacity-70 mt-1" style={{ color: tema.texto }}>
                {estado && estado.stripe_account_id
                  ? 'Empezaste el proceso pero todavía falta completar algún dato. Continuá donde lo dejaste.'
                  : 'Sin esto, nadie va a poder pagar por el contenido que ofrezcas dentro de esta app.'}
              </div>
            </div>
            <UI.Boton onClick={conectar} disabled={conectando}>
              {conectando ? 'Abriendo...' : (estado && estado.stripe_account_id ? 'Continuar configuración' : 'Conectar mi cuenta de pagos')}
            </UI.Boton>
          </div>
        )}
      </div>
    </UI.Tarjeta>
  );
}