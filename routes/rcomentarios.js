module.exports = function (app, swig, gestorBD) {

    app.post('/comentarios/:id', function (req, res) {
        if (req.session.usuario == null)
            res.send("No se puede realizar esta acción si no se ha iniciado sesión.");
        comentario = {
            autor: req.session.usuario,
            texto: req.body.comentario,
            cancion_id: gestorBD.mongo.ObjectID(req.params.id)
        };
        gestorBD.insertarComentario(comentario, function (id) {
            if (id == null) {
                res.send("Error al comentar");
            } else {
                res.redirect("/cancion/" + req.params.id);
            }
        });
    });

};
