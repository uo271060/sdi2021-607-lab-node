module.exports = function (app, swig) {
    app.get("/autores/agregar", function (req, res) {
        let roles = [
            { "nombre": "cantante" },
            { "nombre": "bateria" },
            { "nombre": "guitarrista" },
            { "nombre": "bajista" },
            { "nombre": "teclista" }
        ]
        let respuesta = swig.renderFile('views/bautoresAgregar.html', {
            roles: roles
        });
        res.send(respuesta);
    });
};