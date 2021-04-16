let express = require('express');
let bodyParser = require('body-parser');
let swig = require('swig');
let mongo = require('mongodb');
let gestorBD = require("./modules/gestorBD.js");
let fileUpload = require('express-fileupload');
let crypto = require('crypto');
let expressSession = require('express-session');
let fs = require('fs');
let https = require('https');
let jwt = require('jsonwebtoken');
let app = express();

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
    next();
});

app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));

let routerUsuarioToken = express.Router();
routerUsuarioToken.use(function (req, res, next) {
    let token = req.headers['token'] || req.body.token || req.query.token;
    if (token != null) {
        jwt.verify(token, 'secreto', function (err, infoToken) {
            if (err || (Date.now() / 1000 - infoToken.tiempo) > 240) {
                res.status(403);
                res.json({
                    acceso: false,
                    error: 'Token invalido o caducado'
                });
                return;
            } else {
                res.usuario = infoToken.usuario;
                next();
            }
        });
    } else {
        res.status(403);
        res.json({
            acceso: false,
            mensaje: 'No hay Token'
        });
    }
});
app.use('/api/cancion', routerUsuarioToken);
let routerUsuarioSession = express.Router();
routerUsuarioSession.use(function (req, res, next) {
    console.log("routerUsuarioSession");
    if (req.session.usuario) {
        next();
    } else {
        console.log("va a : " + req.session.destino)
        res.redirect("/identificarse");
    }
});
app.use("/canciones/agregar", routerUsuarioSession);
app.use("/publicaciones", routerUsuarioSession);
app.use("/cancion/comprar", routerUsuarioSession);
app.use("/compras", routerUsuarioSession);

let routerUsuarioAutor = express.Router();
routerUsuarioAutor.use(function (req, res, next) {
    console.log("routerUsuarioAutor");
    let path = require('path');
    let id = path.basename(req.originalUrl);
    gestorBD.obtenerCanciones(
        { _id: mongo.ObjectID(id) }, function (canciones) {
            console.log(canciones[0]);
            if (canciones[0].autor == req.session.usuario) {
                next();
            } else {
                res.redirect("/tienda");
            }
        });
});
app.use("/cancion/modificar", routerUsuarioAutor);
app.use("/cancion/eliminar", routerUsuarioAutor);

let routerAudios = express.Router();
routerAudios.use(function (req, res, next) {
    console.log("routerAudios");
    let path = require('path');
    let idCancion = path.basename(req.originalUrl, '.mp3');
    gestorBD.obtenerCanciones(
        { "_id": mongo.ObjectID(idCancion) }, function (canciones) {
            if (req.session.usuario && canciones[0].autor == req.session.usuario) {
                next();
            } else {
                let criterio = {
                    usuario: req.session.usuario,
                    cancionId: mongo.ObjectID(idCancion)
                };
                gestorBD.obtenerCompras(criterio, function (compras) {
                    if (compras != null && compras.length > 0) {
                        next();
                    } else {
                        res.redirect("/tienda");
                    }
                });
            }
        })
});
app.use("/audios/", routerAudios);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(fileUpload());

app.set('clave', 'abcdefg');
app.set('crypto', crypto);
app.set('port', 8081);
app.set('db', 'mongodb://admin:sdi@tiendamusica-shard-00-00.sixp2.mongodb.net:27017,tiendamusica-shard-00-01.sixp2.mongodb.net:27017,tiendamusica-shard-00-02.sixp2.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-wt3ec4-shard-0&authSource=admin&retryWrites=true&w=majority');
app.set('jwt', jwt);

gestorBD.init(app, mongo);

require("./routes/rusuarios.js")(app, swig, gestorBD);
require("./routes/rcanciones.js")(app, swig, gestorBD);
require("./routes/rautores.js")(app, swig, gestorBD);
require("./routes/rcomentarios.js")(app, swig, gestorBD);
require("./routes/rapicanciones.js")(app, gestorBD);

app.get('/', function (req, res) {
    res.redirect('/tienda');
});

app.use(function (err, req, res, next) {
    console.log("Error ocurrido: " + err);
    if (!res.headersSent) {
        res.status(400);
        res.send("Recurso no disponible");
    }
});

https.createServer({
    key: fs.readFileSync('certificates/alice.key'),
    cert: fs.readFileSync('certificates/alice.crt')
}, app).listen(app.get('port'), function () {
    console.log('Servidor activo');
    console.log('Ejecutandose en https://localhost:' + app.get('port'));
});
