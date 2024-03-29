'use strict'

var User = require('../models/user');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var fs = require('fs');
var path = require('path');

const UPLOAD_DIR = './uploads/users';

function pruebas(req, res) {
    res.status(200).send({
        message: 'Probando una acción del controlador de usuarios del API rest con NodeJS y MongoDB.'
    });
}

function saveUser(req, res) {
    var user = new User();
    var params = req.body;

    console.log(params);

    user.name = params.name;
    user.surname = params.surname;
    user.email = params.email;
    user.role = 'ROLE_USER';
    user.image = 'null';

    if (params.password) {
        bcrypt.hash(params.password, null, null, function(err, hash) {
            user.password = hash;
            if (user.name != null && user.surname != null && user.email != null) {
                // Guardar usuario en la BBDD
                user.save((err, userStored) => {
                    if (err) {
                        res.status(500).send({message: 'Error al guardar el ususario.'})
                    } else {
                        if (!userStored) {
                            res.status(404).send({message: 'No se ha registrado el usuario.'})
                        } else {
                            res.status(200).send({user: userStored});
                        }
                    }
                });
            } else {
                res.status(200).send({message: 'Rellena todos los campos.'})
            }
        });
    } else {
        res.status(200).send({message: 'Introduce la contraseña'});
    }
}

function loginUser(req, res) {
    var params = req.body;
    var email = params.email;
    var password = params.password;

    User.findOne({email: email.toLowerCase()}, (err, user) => {
        if (err) {
            res.status(500).send({ message: 'Error en la petición' });
        } else {
            if (!user) {
                res.status(404).send({ message: 'El usuario no existe' });
            } else {
                bcrypt.compare(password, user.password, function(err, check) {
                    if (check) {
                        // Devolver los datos del usuario logueado
                        if (params.gethash) {
                            // Devolver un token de JWT
                            res.status(200).send({
                                token: jwt.crateToken(user)
                            });
                        } else {
                            res.status(200).send({ user });
                        }
                    } else {
                        res.status(404).send({ message: 'El usuario no ha podido loguearse.' });
                    }
                });
            }
        }
    });
}

function updateUser(req, res) {
    var userId = req.params.id;
    var update = req.body;

    User.findByIdAndUpdate(userId, update, (err, user) => {
        if (err) {
            res.status(500).send({ message: 'Error al actualizar el usuario.' });
        } else {
            if (!user) {
                res.status(400).send({ message: 'No se ha podido actualizar el usuario' });
            } else {
                res.status(200).send({ user: user });
            }
        }
    });
}

function uploadImage(req, res) {
    var userId = req.params.id;
    var file_name = 'No subido..';

    if (req.files) {
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if (file_ext.toUpperCase() == 'PNG' || file_ext.toUpperCase() == 'JPG' || file_ext.toUpperCase() == 'GIF') {
            var current_user = User.findById(userId);
            User.findByIdAndUpdate(userId, {image: file_name}, (err, userUpdated) => {
                if (!userUpdated) {
                    res.status(400).send({ message: 'No se ha podido actualizar el usuario' });
                } else {
                    if (current_user.image != 'null') {
                        fs.exists(UPLOAD_DIR + current_user.image, (exist) => {
                            if (exist) {
                                fs.unlink(UPLOAD_DIR + current_user.image, (err, deleted) => {
                                    if (err) {
                                        res.status(500).send({ message: 'Error al eliminar la imagen anterior' });
                                    } else {
                                        res.status(200).send({ user: user });
                                    }
                                });
                            }
                        });
                    } else {
                        res.status(200).send({ user: user });
                    }
                }
            });
        } else {
            res.status(200).send({ message: 'Extensión no valida, debe ser png, jpg o gif.' });
        }
    } else {
        res.status(200).send({ message: 'No se ha subido ninguna imagen.' });
    }
}

function getImageFile(req, res) {
    var imageFile = req.params.imageFile;
    var pathFile = './uploads/users/' + imageFile;

    fs.exists(pathFile, function(exists) {
        if (exists) {
            res.sendFile(path.resolve(pathFile));
        } else {
            res.status(200).send({ message: 'No existe la imagen...' });
        }
    });
}

module.exports = {
    pruebas,
    saveUser,
    loginUser,
    updateUser,
    uploadImage,
    getImageFile
};