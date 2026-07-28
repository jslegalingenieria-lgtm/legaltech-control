/**
 * JS LegalTech Control - Matriz central de roles y permisos.
 * Los permisos de interfaz complementan, pero no sustituyen, las reglas de Firestore.
 */
(() => {
  "use strict";

  const ROLES = Object.freeze({
    SUPERADMIN: "Superadministrador",
    ADMIN: "Administrador",
    AUXILIAR: "Auxiliar Jurídico",
    ABOGADO: "Abogado",
    PASANTE: "Pasante",
    CLIENTE: "Cliente"
  });

  const PERMISOS = Object.freeze({
    VER_TODO: "ver_todo",
    GESTIONAR_PERSONAL: "gestionar_personal",
    ALTA_PERSONAL: "alta_personal",
    BAJA_PERSONAL: "baja_personal",
    GESTIONAR_CLIENTES: "gestionar_clientes",
    BAJA_CLIENTES: "baja_clientes",
    GESTIONAR_ASUNTOS: "gestionar_asuntos",
    CANCELAR_ASUNTOS: "cancelar_asuntos",
    GESTIONAR_AGENDA: "gestionar_agenda",
    GESTIONAR_BITACORA: "gestionar_bitacora",
    PUBLICAR_AL_CLIENTE: "publicar_al_cliente",
    NOTIFICAR_CLIENTE: "notificar_cliente",
    ASIGNAR_EQUIPO: "asignar_equipo",
    VER_PORTAL_CLIENTE: "ver_portal_cliente",
    CONFIGURACION_TECNICA: "configuracion_tecnica",
    VER_EXPEDIENTES: "ver_expedientes"
  });

  const MATRIZ = Object.freeze({
    [ROLES.SUPERADMIN]: [
      PERMISOS.VER_EXPEDIENTES,
      PERMISOS.VER_TODO, PERMISOS.GESTIONAR_PERSONAL, PERMISOS.ALTA_PERSONAL,
      PERMISOS.BAJA_PERSONAL, PERMISOS.GESTIONAR_CLIENTES, PERMISOS.BAJA_CLIENTES,
      PERMISOS.GESTIONAR_ASUNTOS, PERMISOS.CANCELAR_ASUNTOS,
      PERMISOS.GESTIONAR_AGENDA, PERMISOS.GESTIONAR_BITACORA,
      PERMISOS.PUBLICAR_AL_CLIENTE, PERMISOS.NOTIFICAR_CLIENTE, PERMISOS.ASIGNAR_EQUIPO,
      PERMISOS.CONFIGURACION_TECNICA
    ],
    [ROLES.ADMIN]: [
      PERMISOS.VER_EXPEDIENTES,
      PERMISOS.VER_TODO, PERMISOS.GESTIONAR_PERSONAL, PERMISOS.ALTA_PERSONAL,
      PERMISOS.BAJA_PERSONAL, PERMISOS.GESTIONAR_CLIENTES, PERMISOS.BAJA_CLIENTES,
      PERMISOS.GESTIONAR_ASUNTOS, PERMISOS.CANCELAR_ASUNTOS,
      PERMISOS.GESTIONAR_AGENDA, PERMISOS.GESTIONAR_BITACORA,
      PERMISOS.PUBLICAR_AL_CLIENTE, PERMISOS.NOTIFICAR_CLIENTE, PERMISOS.ASIGNAR_EQUIPO
    ],
    [ROLES.AUXILIAR]: [
      PERMISOS.VER_EXPEDIENTES,
      PERMISOS.VER_TODO, PERMISOS.GESTIONAR_CLIENTES, PERMISOS.GESTIONAR_ASUNTOS,
      PERMISOS.GESTIONAR_AGENDA, PERMISOS.GESTIONAR_BITACORA
    ],
    [ROLES.ABOGADO]: [
      PERMISOS.VER_EXPEDIENTES,
      PERMISOS.GESTIONAR_CLIENTES, PERMISOS.BAJA_CLIENTES,
      PERMISOS.GESTIONAR_ASUNTOS, PERMISOS.CANCELAR_ASUNTOS,
      PERMISOS.GESTIONAR_AGENDA, PERMISOS.GESTIONAR_BITACORA,
      PERMISOS.PUBLICAR_AL_CLIENTE, PERMISOS.NOTIFICAR_CLIENTE
    ],
    [ROLES.PASANTE]: [
      PERMISOS.VER_EXPEDIENTES,
      PERMISOS.GESTIONAR_CLIENTES, PERMISOS.GESTIONAR_ASUNTOS,
      PERMISOS.GESTIONAR_AGENDA, PERMISOS.GESTIONAR_BITACORA
    ],
    [ROLES.CLIENTE]: [PERMISOS.VER_PORTAL_CLIENTE]
  });

  function sesionActual() {
    try {
      const raw = sessionStorage.getItem("js_legal_usuario") || localStorage.getItem("js_legal_session");
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function tienePermiso(permiso, sesion = sesionActual()) {
    if (!sesion || sesion.estado === "Baja") return false;
    return (MATRIZ[sesion.rol] || []).includes(permiso);
  }

  function esRol(...roles) {
    const sesion = sesionActual();
    return Boolean(sesion && roles.includes(sesion.rol));
  }

  function identificadoresUsuario(sesion = sesionActual()) {
    return [sesion?.uid, sesion?.id, sesion?.usuario, sesion?.correo]
      .filter(Boolean).map(v => String(v).trim().toLowerCase());
  }

  window.JSLegalRoles = { ROLES, PERMISOS, MATRIZ, sesionActual, tienePermiso, esRol, identificadoresUsuario };
})();
