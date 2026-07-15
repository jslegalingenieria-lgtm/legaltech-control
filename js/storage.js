/**
 * ============================================================
 * JS LegalTech Control
 * storage.js
 * Administrador central del LocalStorage
 * ============================================================
 */

const Storage = {

    // Leer una colección
    get(clave) {
        try {
            return JSON.parse(localStorage.getItem(clave)) || [];
        } catch (e) {
            console.error("Error leyendo:", clave, e);
            return [];
        }
    },

    // Guardar una colección
    set(clave, datos) {
        localStorage.setItem(clave, JSON.stringify(datos));
    },

    // Eliminar una colección
    remove(clave) {
        localStorage.removeItem(clave);
    },

    // Obtener un registro por ID
    getById(clave, id) {
        return this.get(clave).find(r => String(r.id) === String(id));
    },

    // Agregar un registro
    insert(clave, registro) {

        const datos = this.get(clave);

        registro.id = registro.id || Date.now();

        datos.push(registro);

        this.set(clave, datos);

        return registro;

    },

    // Actualizar registro
    update(clave, id, nuevosDatos) {

        const datos = this.get(clave);

        const indice = datos.findIndex(r => String(r.id) === String(id));

        if (indice === -1)
            return false;

        datos[indice] = {
            ...datos[indice],
            ...nuevosDatos
        };

        this.set(clave, datos);

        return true;

    },

    // Eliminar registro
    delete(clave, id) {

        const datos = this
            .get(clave)
            .filter(r => String(r.id) !== String(id));

        this.set(clave, datos);

    }

};