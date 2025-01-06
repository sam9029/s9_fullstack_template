const express = require('express');
const path = require('path');
const router = express.Router();
const logger = require('morgan');

const app = express();

app.set('views', path.join(__dirname, './'));
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

app.use(logger('dev'));

app.use(express.static(path.join(__dirname, './')));

router.get('/*', function (req, res) {
  res.render("index")
});


app.use(router);

let port = process.env.PORT || 8080;
app.listen(port);
