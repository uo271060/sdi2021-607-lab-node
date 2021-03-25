let express = require('express');
let bodyParser = require('body-parser');
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', 8081)
app.use(express.static('public'));

require("./routes/rusuarios.js")(app);
require("./routes/rcanciones.js")(app);

app.listen(app.get('port'), function () {
    console.log('Servidor activo');
    console.log('Ejecutandose en http://localhost:' + app.get('port'));
});