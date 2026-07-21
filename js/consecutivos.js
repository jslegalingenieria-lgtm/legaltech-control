/** Consecutivos de clientes, abogados y asuntos. */
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
      tx.set(ref, {
        [tipo]: siguiente,
        actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return `${prefijo}-${siguiente}`;
    });
  }

  window.siguienteConsecutivo = siguienteConsecutivo;
})();
