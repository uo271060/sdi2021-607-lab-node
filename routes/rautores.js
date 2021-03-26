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

    app.post("/autores/agregar", function (req, res) {
        let respuesta = " Autor agregado: ";
        if (req.body.nombre != "")
            respuesta += req.body.nombre;
        else
            respuesta += "No enviado en la petición";
        respuesta += "<br>" + " Grupo: ";
        if (req.body.grupo != "")
            respuesta += req.body.grupo;
        else
            respuesta += "No enviado en la petición";
        respuesta += "<br>" + " Rol: ";
        respuesta += req.body.rol;
        res.send(respuesta);
    });
};