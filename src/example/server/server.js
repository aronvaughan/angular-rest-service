var application_root = __dirname,
    express = require("express"),
    path = require("path"),
    lodash = require("lodash"),
    bodyParser = require('body-parser');

var app = express();
app.use(bodyParser());

/**
 * we don't ever use this but this is the model
 * @type {{id: undefined, name: undefined}}
 */
var NameObject = {
    id: undefined,
    name: undefined
};

/**
 * holds our in memory names array
 * @type {Array}
 */
var nameInstances = [];

/**
 * get all the names registered
 */
app.get('/names', function(req, res) {
    console.log("names get called, returning: ", nameInstances);
    res.send(JSON.stringify(nameInstances));
});

/*
 * find an element's index in our in memory array by id
 */
var findIndex = function(id) {
    var index = lodash.findIndex(nameInstances, {
        'id': id
    });
    return index;
};

/*
 * find an element by id in our in memory array
 */
var findById = function(id) {
    var index = findIndex(id);
    var result = undefined;

    if (index >= 0) {
        result = nameInstances[index];
    }
    return result;
};

/**
 * get a single name by id
 */
app.get('/names/:id', function(req, res) {
    console.log("names get by id called, id: " + req.params.id);

    var result = findById(req.params.id);
    console.log('returning names by id, ', result);
    res.send(JSON.stringify(result));
});

/**
 * create a new entry in our names array
 */
app.post('/names', function(req, res) {
    var name = req.body;
    console.log("SERVER names post called", name);
    console.log('SERVER creating with : ' + JSON.stringify(name));
    nameInstances.push(name);
    if (name.id === undefined) {
        name.id = (nameInstances.length - 1).toString();
    }
    res.send(JSON.stringify(name));
});

/**
 * update a name in our names array
 */
app.put('/names/:id', function(req, res) {
    console.log("SERVER, names put called, id: ", req.params.id);
    var index = findIndex(req.params.id);

    var name = req.body;
    console.log('SERVER, updating with : ' + JSON.stringify(name));

    if (index >= 0) {
        nameInstances[index] = name;
    } else {
        nameInstances.push(name);
    }
    res.send(JSON.stringify(name));
});

/**
 * delete a name by id
 */
app.delete('/names/:id', function(req, res) {
    console.log("names delete called, id: ", req.params.id);
    var index = findIndex(req.params.id);

    console.log('deleting object @ index : ' + index);

    var nameDeleted = undefined;
    if (index >= 0) {
        nameDeleted = nameInstances[index];
        nameInstances.splice(index, 1);
    }
    res.send(nameDeleted);
});

/**
 * startup express listening to the standard port
 * @type {http.Server}
 */
var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
