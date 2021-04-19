module.exports = function (app, gestorBD) {

    app.get("/api/cancion", function (req, res) {
        gestorBD.obtenerCanciones({}, function (canciones) {
            if (canciones == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                res.status(200);
                res.send(JSON.stringify(canciones));
            }
        });
    });

    app.post("/api/cancion", function (req, res) {
        let cancion = {
            nombre: req.body.nombre,
            genero: req.body.genero,
            precio: req.body.precio,
        }
        validarCrearCancion(cancion, function (errors) {
            if (errors.length == 0) {
                gestorBD.insertarCancion(cancion, function (id) {
                    if (id == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else {
                        res.status(201);
                        res.json({
                            mensaje: "canción insertada",
                            _id: id
                        })
                    }
                });
            } else {
                res.status(500);
                res.json({
                    errors: errors
                })
            }
        });
    });

    function validarCrearCancion(cancion, callback) {
        var errors = [];
        if (cancion.nombre == "")
            errors.push("El nombre no puede estar vacio.");
        if (cancion.genero == "")
            errors.push("El género no puede estar vacio.");
        if (typeof cancion.precio != 'number')
            errors.push("El precio debe ser un numero.");
        else if (cancion.precio < 0)
            errors.push("El precio no puede ser negativo.");
        callback(errors);
    }

    app.post("/api/autenticar/", function (req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email: req.body.email,
            password: seguro
        }

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                res.status(401);
                res.json({
                    autenticado: false
                })
            } else {
                let token = app.get('jwt').sign(
                    { usuario: criterio.email, tiempo: Date.now() / 1000 },
                    "secreto");
                res.status(200);
                res.json({
                    autenticado: true,
                    token: token
                });
            }
        });
    });

    app.put("/api/cancion/:id", function (req, res) {

        let criterio = { "_id": gestorBD.mongo.ObjectID(req.params.id) };

        let cancion = {}; // Solo los atributos a modificar
        if (req.body.nombre != null)
            cancion.nombre = req.body.nombre;
        if (req.body.genero != null)
            cancion.genero = req.body.genero;
        if (req.body.precio != null)
            cancion.precio = req.body.precio;
        cancion.usuario = req.body.usuario;
        validarModificarCancion(cancion, criterio, function (errors) {
            if (errors.length == 0) {
                gestorBD.modificarCancion(criterio, cancion, function (result) {
                    if (result == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else {
                        res.status(200);
                        res.json({
                            mensaje: "canción modificada",
                            _id: req.params.id
                        })
                    }
                });
            } else {
                res.status(500);
                res.json({
                    errors: errors
                })
            }
        });
    });

    function validarModificarCancion(cancion, criterio, callback) {
        var errors = [];
        if (cancion.nombre == "")
            errors.push("El nombre no puede estar vacio.");
        if (cancion.genero == "")
            errors.push("El género no puede estar vacio.");
        if (typeof cancion.precio != 'number')
            errors.push("El precio debe ser un numero.");
        else if (cancion.precio < 0)
            errors.push("El precio no puede ser negativo.");
        gestorBD.obtenerCanciones(criterio, cancion, function (c) {
            if (c == null) {
                errors.push("La cancion a modificar no existe.");
                callback(errors);
            } else {
                if (c[0].autor != cancion.usuario)
                    errors.push("No se puede modificar una canción de la que no eres su autor.");
                callback(errors);
            }
        });
        callback(errors);
    }

    app.get("/api/cancion/:id", function (req, res) {
        let criterio = { "_id": gestorBD.mongo.ObjectID(req.params.id) }

        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                res.status(200);
                res.send(JSON.stringify(canciones[0]));
            }
        });
    });

    app.delete("/api/cancion/:id", function (req, res) {
        let criterio = { "_id": gestorBD.mongo.ObjectID(req.params.id) }

        validarBorrarCancion(req.body.usuario, criterio, function (errors) {
            if (errors.length == 0) {
                gestorBD.eliminarCancion(criterio, function (canciones) {
                    if (canciones == null) {
                        res.status(500);
                        res.json({
                            error: "se ha producido un error"
                        })
                    } else {
                        res.status(200);
                        res.send(JSON.stringify(canciones));
                    }
                });
            } else {
                res.status(500);
                res.json({
                    errors: errors
                })
            }
        });
    });

    function validarBorrarCancion(user, criterio, callback) {
        var errors = [];
        gestorBD.obtenerCanciones(criterio, cancion, function (c) {
            if (c == null) {
                errors.push("La cancion a borrar no existe.");
                callback(errors);
            } else {
                if (c[0].autor != user)
                    errors.push("No se puede borrar una canción de la que no eres su autor.");
                callback(errors);
            }
        });
        callback(errors);
    }

}
