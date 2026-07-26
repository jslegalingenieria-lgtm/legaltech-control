const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const ROLES = ["Superadministrador", "Administrador", "Auxiliar Jurídico", "Abogado", "Pasante"];

async function perfilSolicitante(auth) {
  if (!auth?.uid) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  const snap = await db.collection("personal").doc(auth.uid).get();
  if (!snap.exists) throw new HttpsError("permission-denied", "No tienes un perfil administrativo.");
  const perfil = snap.data();
  if (perfil.estado !== "Activo") throw new HttpsError("permission-denied", "Tu cuenta está inactiva.");
  return perfil;
}

function puedeCrear(solicitante, rolNuevo) {
  if (solicitante.rol === "Superadministrador") return true;
  if (solicitante.rol === "Administrador") return rolNuevo !== "Superadministrador";
  if (solicitante.rol === "Auxiliar Jurídico") {
    return ["Auxiliar Jurídico", "Abogado", "Pasante"].includes(rolNuevo);
  }
  return false;
}

exports.crearUsuarioDelSistema = onCall({ region: "us-central1" }, async request => {
  const solicitante = await perfilSolicitante(request.auth);
  const data = request.data || {};
  const nombre = String(data.nombre || "").trim();
  const correo = String(data.correo || "").trim().toLowerCase();
  const usuario = String(data.usuario || "").trim();
  const passwordTemporal = String(data.passwordTemporal || "");
  const rol = String(data.rol || "");
  const estado = data.estado === "Baja" ? "Baja" : "Activo";

  if (!nombre || !correo || !usuario || !passwordTemporal || !ROLES.includes(rol)) {
    throw new HttpsError("invalid-argument", "Faltan datos obligatorios o el rol no es válido.");
  }
  if (passwordTemporal.length < 8) {
    throw new HttpsError("invalid-argument", "La contraseña temporal debe tener al menos 8 caracteres.");
  }
  if (!puedeCrear(solicitante, rol)) {
    throw new HttpsError("permission-denied", "Tu rol no puede crear este tipo de usuario.");
  }

  let authUser;
  try {
    authUser = await admin.auth().createUser({
      email: correo,
      password: passwordTemporal,
      displayName: nombre,
      disabled: estado !== "Activo"
    });

    await admin.auth().setCustomUserClaims(authUser.uid, { rol });
    await db.collection("personal").doc(authUser.uid).set({
      uid: authUser.uid,
      nombre,
      correo,
      usuario,
      usuarioNormalizado: usuario.toLowerCase(),
      rol,
      estado,
      activo: estado === "Activo",
      abogadoCodigo: data.abogadoCodigo || "",
      abogadoSupervisorUid: rol === "Pasante" ? String(data.abogadoSupervisorUid || "") : "",
      abogadoSupervisorUsuario: rol === "Pasante" ? String(data.abogadoSupervisorUsuario || "") : "",
      debeCambiarPassword: true,
      creadoPorUid: request.auth.uid,
      fechaAlta: admin.firestore.FieldValue.serverTimestamp(),
      fechaModificacion: admin.firestore.FieldValue.serverTimestamp()
    });

    return { uid: authUser.uid, correo };
  } catch (error) {
    if (authUser?.uid) await admin.auth().deleteUser(authUser.uid).catch(() => {});
    if (error.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Ese correo ya existe en Firebase Authentication.");
    }
    throw new HttpsError("internal", error.message || "No fue posible crear el usuario.");
  }
});

exports.restablecerPasswordTemporal = onCall({ region: "us-central1" }, async request => {
  const solicitante = await perfilSolicitante(request.auth);
  if (!["Superadministrador", "Administrador"].includes(solicitante.rol)) {
    throw new HttpsError("permission-denied", "Solo un administrador puede restablecer contraseñas.");
  }

  const uid = String(request.data?.uid || "");
  const passwordTemporal = String(request.data?.passwordTemporal || "");
  if (!uid || passwordTemporal.length < 8) {
    throw new HttpsError("invalid-argument", "UID o contraseña temporal no válidos.");
  }

  const objetivo = await db.collection("personal").doc(uid).get();
  if (!objetivo.exists) throw new HttpsError("not-found", "No se encontró el usuario.");
  if (solicitante.rol === "Administrador" && objetivo.data().rol === "Superadministrador") {
    throw new HttpsError("permission-denied", "Un administrador no puede modificar al Superadministrador.");
  }

  await admin.auth().updateUser(uid, { password: passwordTemporal });
  await objetivo.ref.set({
    debeCambiarPassword: true,
    passwordTemporalRestablecidaPorUid: request.auth.uid,
    fechaModificacion: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { ok: true };
});
