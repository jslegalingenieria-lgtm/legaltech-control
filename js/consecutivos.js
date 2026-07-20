/** Consecutivos y utilidades de datos de demostración. */
(() => {
  "use strict";

  function db() {
    if (!window.db) throw new Error("Firestore no está disponible.");
    return window.db;
  }

  async function siguienteConsecutivo(tipo, prefijo) {
    const ref = db().collection("configuracion").doc("consecutivos");
    return db().runTransaction(async tx => {
      const snap = await tx.get(ref);
      const actual = Number(snap.exists ? snap.data()[tipo] : 0) || 0;
      const siguiente = actual + 1;
      tx.set(ref, { [tipo]: siguiente, actualizadoEn: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return `${prefijo}-${siguiente}`;
    });
  }

  async function eliminarDatosDemo() {
    const confirmado = confirm("Se eliminarán físicamente únicamente los registros marcados como datos de demostración. ¿Continuar?");
    if (!confirmado) return;

    const segunda = prompt('Escribe ELIMINAR DEMO para confirmar:');
    if (segunda !== 'ELIMINAR DEMO') {
      alert('Operación cancelada.');
      return;
    }

    const sesion = window.obtenerUsuarioSesion?.();
    if (!sesion || sesion.rol !== 'Administrador') {
      alert('Solo un administrador puede eliminar datos de demostración.');
      return;
    }

    const colecciones = ["clientes", "personal", "asuntos", "agenda", "alertas", "notificaciones"];
    let total = 0;
    const detalle = [];

    try {
      for (const nombre of colecciones) {
        const snap = await db().collection(nombre).where("esDemo", "==", true).get();
        let eliminadosColeccion = 0;

        for (let i = 0; i < snap.docs.length; i += 400) {
          const loteDocs = snap.docs.slice(i, i + 400);
          const batch = db().batch();
          loteDocs.forEach(documento => batch.delete(documento.ref));
          await batch.commit();
          eliminadosColeccion += loteDocs.length;
        }

        total += eliminadosColeccion;
        detalle.push(`${nombre}: ${eliminadosColeccion}`);
      }

      // Limpiar las cachés locales para que los registros borrados no sigan
      // apareciendo mientras llegan los nuevos snapshots de Firestore.
      ["js_legal_clientes", "js_legal_asuntos", "js_legal_agenda", "js_legal_personal"].forEach(clave => {
        try { localStorage.removeItem(clave); } catch (_) {}
      });

      if (typeof window.cargarClientesTabla === 'function') window.cargarClientesTabla();
      if (typeof window.cargarAsuntosTabla === 'function') window.cargarAsuntosTabla();
      if (typeof window.renderizarTablaPersonal === 'function') window.renderizarTablaPersonal();
      if (typeof window.renderizarCalendarioJuridico === 'function') window.renderizarCalendarioJuridico();

      alert(`Datos de demostración eliminados: ${total} registro(s).\n\n${detalle.join('\n')}`);
    } catch (error) {
      console.error('Error eliminando datos demo:', error);
      const mensaje = error?.code === 'permission-denied'
        ? 'Firestore rechazó la eliminación. Publica el archivo firestore.rules incluido en esta versión y vuelve a intentarlo.'
        : (error?.message || 'Error desconocido.');
      alert(`No se pudieron eliminar los datos de demostración.\n\n${mensaje}`);
    }
  }

  async function reiniciarConsecutivosDemo() {
    const texto = prompt('Esta acción reinicia CLI, ABG y EXP. Escribe REINICIAR para confirmar:');
    if (texto !== 'REINICIAR') return alert('Operación cancelada.');
    await db().collection("configuracion").doc("consecutivos").set({
      clientes: 0, abogados: 0, asuntos: 0,
      actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    alert('Consecutivos reiniciados. Úsalo únicamente después de limpiar los datos de prueba.');
  }

  Object.assign(window, { siguienteConsecutivo, eliminarDatosDemo, reiniciarConsecutivosDemo });
})();
