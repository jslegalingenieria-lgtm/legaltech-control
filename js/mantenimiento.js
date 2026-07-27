/**
 * Mantenimiento de consecutivos.
 * Acceso exclusivo desde la interfaz para Superadministrador.
 */
(() => {
  "use strict";

  const TIPOS = {
    abogados: {
      etiqueta: "Personal",
      coleccion: "personal",
      campo: "abogadoCodigo",
      prefijo: "ABG"
    },
    clientes: {
      etiqueta: "Clientes",
      coleccion: "clientes",
      campo: "clienteCodigo",
      prefijo: "CLI"
    },
    asuntos: {
      etiqueta: "Asuntos",
      coleccion: "asuntos",
      campo: "folioInterno",
      prefijo: "EXP"
    }
  };

  function sesionActual() {
    try {
      return JSON.parse(sessionStorage.getItem("js_legal_usuario") || localStorage.getItem("js_legal_session") || "null");
    } catch (_) {
      return null;
    }
  }

  function exigirSuperadministrador() {
    const usuario = sesionActual();
    if (usuario?.rol !== "Superadministrador") {
      throw new Error("Esta función es exclusiva del Superadministrador.");
    }
    return usuario;
  }

  function obtenerNumero(codigo, prefijo) {
    const texto = String(codigo || "").trim();
    const coincidencia = texto.match(new RegExp(`^${prefijo}-(\\d+)$`, "i"));
    return coincidencia ? Number(coincidencia[1]) : 0;
  }

  async function analizarTipo(tipo) {
    const cfg = TIPOS[tipo];
    if (!cfg) throw new Error("Tipo de consecutivo no reconocido.");

    const [configSnap, registrosSnap] = await Promise.all([
      window.db.collection("configuracion").doc("consecutivos").get(),
      window.db.collection(cfg.coleccion).get()
    ]);

    const actual = Number(configSnap.exists ? configSnap.data()[tipo] : 0) || 0;
    let maximoExistente = 0;
    let registrosConCodigo = 0;

    registrosSnap.forEach(doc => {
      const numero = obtenerNumero(doc.data()?.[cfg.campo], cfg.prefijo);
      if (numero > 0) registrosConCodigo += 1;
      if (numero > maximoExistente) maximoExistente = numero;
    });

    return {
      tipo,
      ...cfg,
      actual,
      maximoExistente,
      totalRegistros: registrosSnap.size,
      registrosConCodigo,
      recomendado: maximoExistente
    };
  }

  function pintarEstado(info) {
    const actual = document.getElementById(`mant-actual-${info.tipo}`);
    const maximo = document.getElementById(`mant-maximo-${info.tipo}`);
    const total = document.getElementById(`mant-total-${info.tipo}`);
    const input = document.getElementById(`mant-nuevo-${info.tipo}`);
    const ayuda = document.getElementById(`mant-ayuda-${info.tipo}`);

    if (actual) actual.textContent = info.actual;
    if (maximo) maximo.textContent = info.maximoExistente;
    if (total) total.textContent = info.totalRegistros;
    if (input) {
      input.min = String(info.maximoExistente);
      input.value = String(info.recomendado);
    }
    if (ayuda) {
      ayuda.textContent = info.maximoExistente === 0
        ? "No hay códigos existentes. Puedes reiniciar en 0 para que el siguiente sea 1."
        : `El valor no puede ser menor que ${info.maximoExistente}, porque ya existe un registro con ese número.`;
    }
  }

  async function cargarMantenimientoConsecutivos() {
    try {
      exigirSuperadministrador();
      const estado = document.getElementById("mant-estado-general");
      if (estado) estado.textContent = "Consultando consecutivos y registros existentes...";

      const resultados = await Promise.all(Object.keys(TIPOS).map(analizarTipo));
      resultados.forEach(pintarEstado);

      if (estado) estado.textContent = "Información actualizada. Revisa los valores antes de guardar.";
    } catch (error) {
      console.error("Error cargando mantenimiento:", error);
      alert(error.message || "No fue posible cargar el mantenimiento de consecutivos.");
      if (typeof window.switchTab === "function") window.switchTab("dashboard");
    }
  }

  async function reiniciarConsecutivo(tipo) {
    const usuario = exigirSuperadministrador();
    const info = await analizarTipo(tipo);
    const input = document.getElementById(`mant-nuevo-${tipo}`);
    const confirmacion = document.getElementById(`mant-confirmacion-${tipo}`);
    const nuevoValor = Number(input?.value);

    if (!Number.isInteger(nuevoValor) || nuevoValor < 0) {
      alert("Escribe un número entero igual o mayor que 0.");
      return;
    }
    if (nuevoValor < info.maximoExistente) {
      alert(`No puedes establecer ${nuevoValor}. Ya existe un código hasta ${info.prefijo}-${info.maximoExistente}.`);
      return;
    }
    if (String(confirmacion?.value || "").trim().toUpperCase() !== "REINICIAR") {
      alert('Escribe la palabra REINICIAR para confirmar.');
      return;
    }

    const mensaje = nuevoValor === 0
      ? `El siguiente código de ${info.etiqueta.toLowerCase()} será ${info.prefijo}-1. ¿Deseas continuar?`
      : `El siguiente código de ${info.etiqueta.toLowerCase()} será ${info.prefijo}-${nuevoValor + 1}. ¿Deseas continuar?`;

    if (!confirm(mensaje)) return;

    const ref = window.db.collection("configuracion").doc("consecutivos");
    await window.db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const valorAnterior = Number(snap.exists ? snap.data()[tipo] : 0) || 0;

      tx.set(ref, {
        [tipo]: nuevoValor,
        actualizadoEn: firebase.firestore.FieldValue.serverTimestamp(),
        actualizadoPor: usuario.usuario || usuario.nombre || usuario.id || "Superadministrador"
      }, { merge: true });

      const auditoriaRef = window.db.collection("auditoriaSistema").doc();
      tx.set(auditoriaRef, {
        accion: "Reinicio de consecutivo",
        tipo,
        etiqueta: info.etiqueta,
        valorAnterior,
        valorNuevo: nuevoValor,
        maximoExistente: info.maximoExistente,
        usuario: usuario.usuario || "",
        nombreUsuario: usuario.nombre || "",
        rol: usuario.rol,
        fecha: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    if (confirmacion) confirmacion.value = "";
    alert(`Consecutivo de ${info.etiqueta.toLowerCase()} actualizado correctamente.`);
    await cargarMantenimientoConsecutivos();
  }

  window.cargarMantenimientoConsecutivos = cargarMantenimientoConsecutivos;
  window.reiniciarConsecutivo = reiniciarConsecutivo;
})();
