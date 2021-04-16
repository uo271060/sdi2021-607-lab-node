module.exports = function (app, swig, gestorBD) {

    app.get('/error', function (req, res) {
        let respuesta = swig.renderFile('views/error.html',
            {
            });
        res.send(respuesta);
    });

    app.get("/canciones", function (req, res) {
        let canciones = [
            { "nombre": "Blank space", "precio": "1.2" },
            { "nombre": "See you again", "precio": "1.3" },
            { "nombre": "Uptown Funk", "precio": "1.1" }
        ]
        let respuesta = swig.renderFile('views/btienda.html', {
            vendedor: "Tienda de canciones",
            canciones: canciones
        });
        res.send(respuesta);
    });

    app.post("/cancion", function (req, res) {
        let cancion = {
            nombre: req.body.nombre,
            genero: req.body.genero,
            precio: req.body.precio,
            autor: req.session.usuario
        }
        // Conectarse
        gestorBD.insertarCancion(cancion, function (id) {
            if (id == null) {
                res.redirect("/canciones/agregar");
            } else {
                if (req.files.portada != null) {
                    var imagen = req.files.portada;
                    imagen.mv('public/portadas/' + id + '.png', function (err) {
                        if (err) {
                            res.redirect("/canciones/agregar");
                        } else {
                            if (req.files.audio != null) {
                                let audio = req.files.audio;
                                audio.mv('public/audios/' + id + '.mp3', function (err) {
                                    if (err) {
                                        res.redirect("/canciones/agregar");
                                    } else {
                                        res.redirect("/publicaciones");
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    });

    app.get('/canciones/agregar', function (req, res) {
        let respuesta = swig.renderFile('views/bagregar.html', {
        });
        res.send(respuesta);
    });

    app.get('/compras', function (req, res) {
        let criterio = { "usuario": req.session.usuario };
        gestorBD.obtenerCompras(criterio, function (compras) {
            if (compras == null)
                res.send("Error al listar");
            else {
                let cancionesCompradasIds = [];
                for (i = 0; i < compras.length; i++)
                    cancionesCompradasIds.push(compras[i].cancionId);
                let criterio = { "_id": { $in: cancionesCompradasIds } };
                gestorBD.obtenerCanciones(criterio, function (canciones) {
                    let respuesta = swig.renderFile('views/bcompras.html', {
                        canciones: canciones
                    });
                    res.send(respuesta);
                });
            }
        });
    });

    app.get('/cancion/comprar/:id', function (req, res) {
        let criterio = { "_id": gestorBD.mongo.ObjectID(req.params.id) };
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                res.redirect("/error?mensaje=No se pudo encontrar la canción a comprar&tipoMensaje=alert-danger");
            } else {
                if (canciones[0].autor == req.session.usuario)
                    res.redirect("/error?mensaje=No puedes comprar una de tus publicaciones&tipoMensaje=alert-danger");
                else {
                    gestorBD.obtenerCompras({ cancionId: canciones[0]._id, usuario: req.session.usuario }, function (compras) {
                        if (compras.length == 1)
                            res.redirect("/error?mensaje=No se puede comprar una canción ya comprada&tipoMensaje=alert-danger");
                        else {
                            let compra = {
                                usuario: req.session.usuario,
                                cancionId: gestorBD.mongo.ObjectID(req.params.id)
                            }
                            gestorBD.insertarCompra(compra, function (idCompra) {
                                if (idCompra == null) {
                                    res.redirect("/error?mensaje=No se pudo completar el proceso de compra por un error inesperado&tipoMensaje=alert-danger");
                                } else {
                                    res.redirect("/compras");
                                }
                            });
                        }
                    });
                }
            }
        });
    });

    app.get('/cancion/modificar/:id', function (req, res) {
        let criterio = { "_id": gestorBD.mongo.ObjectID(req.params.id) };
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                res.send(respuesta);
            } else {
                let respuesta = swig.renderFile('views/bcancionModificar.html',
                    {
                        cancion: canciones[0]
                    });
                res.send(respuesta);
            }
        });
    });

    app.get('/cancion/eliminar/:id', function (req, res) {
        let criterio = { "_id": gestorBD.mongo.ObjectID(req.params.id) };
        gestorBD.eliminarCancion(criterio, function (canciones) {
            if (canciones == null) {
                res.send(respuesta);
            } else {
                res.redirect("/publicaciones");
            }
        });
    });

    app.get('/cancion/:id', function (req, res) {
        let criterio = { "_id": gestorBD.mongo.ObjectID(req.params.id) };
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                res.send("Error al listar comentarios.");
            } else {
                gestorBD.obtenerComentarios({ "cancion_id": gestorBD.mongo.ObjectID(req.params.id) }, function (comentarios) {
                    if (comentarios == null) {
                        res.send("Error al listar.");
                    } else {
                        if (canciones[0].autor == req.session.usuario) {
                            let respuesta = swig.renderFile('views/bcancion.html',
                                {
                                    cancion: canciones[0],
                                    comentarios: comentarios,
                                    comprada: true
                                });
                            res.send(respuesta);
                        } else {
                            gestorBD.obtenerCompras(
                                {
                                    cancionId: canciones[0]._id,
                                    usuario: req.session.usuario
                                }
                                , function (compras) {
                                    let comprada = compras.length == 1;
                                    let configuracion = {
                                        url: "https://www.freeforexapi.com/api/live?pairs=EURUSD",
                                        method: "get",
                                        headers: {
                                            "token": "ejemplo",
                                        }
                                    }
                                    let rest = app.get("rest");
                                    rest(configuracion, function (error, response, body) {
                                        console.log("cod: " + response.statusCode + " Cuerpo :" + body);
                                        let objetoRespuesta = JSON.parse(body);
                                        let cambioUSD = objetoRespuesta.rates.EURUSD.rate;
                                        canciones[0].usd = cambioUSD * canciones[0].precio;
                                        let respuesta = swig.renderFile('views/bcancion.html',
                                            {
                                                cancion: canciones[0],
                                                comentarios: comentarios,
                                                comprada: comprada
                                            });
                                        res.send(respuesta);
                                    })
                                });
                        }
                    }
                });
            }
        });
    });

    app.post('/cancion/modificar/:id', function (req, res) {
        let id = req.params.id;
        let criterio = { "_id": gestorBD.mongo.ObjectID(id) };
        let cancion = {
            nombre: req.body.nombre,
            genero: req.body.genero,
            precio: req.body.precio
        }
        gestorBD.modificarCancion(criterio, cancion, function (result) {
            if (result == null) {
                res.redirect("/cancion/modificar/" + id);
            } else {
                paso1ModificarPortada(req.files, id, function (result) {
                    if (result == null) {
                        res.redirect("/cancion/modificar/" + id);
                    } else {
                        res.redirect("/publicaciones");
                    }
                });
            }
        });
    });

    function paso1ModificarPortada(files, id, callback) {
        if (files && files.portada != null) {
            let imagen = files.portada;
            imagen.mv('public/portadas/' + id + '.png', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    paso2ModificarAudio(files, id, callback); // SIGUIENTE
                }
            });
        } else {
            paso2ModificarAudio(files, id, callback); // SIGUIENTE
        }
    };

    function paso2ModificarAudio(files, id, callback) {
        if (files && files.audio != null) {
            let audio = files.audio;
            audio.mv('public/audios/' + id + '.mp3', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    callback(true); // FIN
                }
            });
        } else {
            callback(true); // FIN
        }
    };

    app.get('/canciones/:genero/:id', function (req, res) {
        let respuesta = 'id: ' + req.params.id + '<br>'
            + 'Género: ' + req.params.genero;
        res.send(respuesta);
    });

    app.get('/suma', function (req, res) {
        let respuesta = parseInt(req.query.num1) + parseInt(req.query.num2);
        res.send(String(respuesta));
    });

    app.get('/promo*', function (req, res) {
        res.send('Respuesta patrón promo* ');
    });

    app.get("/tienda", function (req, res) {
        let criterio = {};
        if (req.query.busqueda != null) {
            criterio = { "nombre": { $regex: ".*" + req.query.busqueda + ".*" } };
        }
        let pg = parseInt(req.query.pg);
        if (req.query.pg == null) {
            pg = 1;
        }
        gestorBD.obtenerCancionesPg(criterio, pg, function (canciones, total) {
            if (canciones == null) {
                res.send("Error al listar ");
            } else {
                let ultimaPg = total / 4;
                if (total % 4 > 0) { // Sobran decimales
                    ultimaPg = ultimaPg + 1;
                }
                let paginas = []; // paginas mostrar
                for (let i = pg - 2; i <= pg + 2; i++) {
                    if (i > 0 && i <= ultimaPg) {
                        paginas.push(i);
                    }
                }
                let respuesta = swig.renderFile('views/btienda.html', {
                    canciones: canciones,
                    paginas: paginas,
                    actual: pg
                });
                res.send(respuesta);
            }
        });
    });

    app.get("/publicaciones", function (req, res) {
        let criterio = { autor: req.session.usuario };
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                res.send("Error al listar ");
            } else {
                let respuesta = swig.renderFile('views/bpublicaciones.html',
                    {
                        canciones: canciones
                    });
                res.send(respuesta);
            }
        });
    });


};
