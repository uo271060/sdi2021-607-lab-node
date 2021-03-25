let express = require('express');
let bodyParser = require('body-parser');
let swig = require('swig');
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', 8081)
app.use(express.static('public'));

require("./routes/rusuarios.js")(app, swig);
require("./routes/rcanciones.js")(app, swig);

app.listen(app.get('port'), function () {
    console.log('Servidor activo');
    console.log('Ejecutandose en http://localhost:' + app.get('port'));
});