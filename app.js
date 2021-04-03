let express = require('express');
let bodyParser = require('body-parser');
let swig = require('swig');
let mongo = require('mongodb');
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('port', 8081);
app.set('db', 'mongodb://admin:sdi@tiendamusica-shard-00-00.sixp2.mongodb.net:27017,tiendamusica-shard-00-01.sixp2.mongodb.net:27017,tiendamusica-shard-00-02.sixp2.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-wt3ec4-shard-0&authSource=admin&retryWrites=true&w=majority');

require("./routes/rusuarios.js")(app, swig, mongo);
require("./routes/rcanciones.js")(app, swig, mongo);
require("./routes/rautores.js")(app, swig, mongo);

app.listen(app.get('port'), function () {
    console.log('Servidor activo');
    console.log('Ejecutandose en http://localhost:' + app.get('port'));
});