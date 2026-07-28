/**
 * JS LegalTech Control
 * Conexión central con Firebase, Authentication y Cloud Firestore.
 */
(() => {
    "use strict";

    const firebaseConfig = {
        apiKey: "AIzaSyCirsdiVuRzrNBFdrurKgH26zX1vMs5xl8",
        authDomain: "legaltech-app.firebaseapp.com",
        projectId: "legaltech-app",
        storageBucket: "legaltech-app.firebasestorage.app",
        messagingSenderId: "1068350106232",
        appId: "1:1068350106232:web:48b2a3510c563c28305b8d",
        measurementId: "G-VSHY6ZJ3GN"
    };

    if (!window.firebase) {
        console.error("Firebase SDK no está cargado.");
        alert("No fue posible cargar Firebase.");
        return;
    }

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const db = firebase.firestore();
    const auth = firebase.auth();
    const functions = typeof firebase.functions === "function" ? firebase.functions() : null;
    const storage = typeof firebase.storage === "function" ? firebase.storage() : null;

    db.enablePersistence({ synchronizeTabs: true }).catch(error => {
        if (error.code === "failed-precondition") {
            console.warn("Firestore ya está abierto en otra pestaña.");
        } else if (error.code === "unimplemented") {
            console.warn("Este navegador no admite persistencia de Firestore.");
        } else {
            console.warn("No se pudo activar la persistencia:", error);
        }
    });

    window.FIREBASE_CONFIG = firebaseConfig;
    window.db = db;
    window.firebaseDB = db;
    window.firebaseAuth = auth;
    window.firebaseFunctions = functions;
    window.firebaseStorage = storage;

    console.log(`✅ Firebase Authentication, Firestore${storage ? " y Storage" : ""} conectados${functions ? "; Cloud Functions disponible" : ""}.`);
})();
