'use strict'

var Artist = require('../models/artist');
var Album = require('../models/album');
var Song = require('../models/song');
var fs = require('fs');
var path = require('path');
var mongoosePaginate = require('mongoose-pagination');

const UPLOAD_DIR = './uploads/albums/';

function getAlbum(req, res) {

    var albumId = req.params.id;
    Album.findById(albumId).populate({path: 'artist'}).exec((err, album) => {
        if (err) {
            res.status(500).send({ message: 'Error en la petición.' });
        } else {
            if (album) {
                res.status(200).send({ album });
            } else {
                res.status(404).send({ message: 'El album no existe.' });
            }
        }
    });

}

function save(req, res) {

    var album = new Album();
    var params = req.body;

    album.title = params.title;
    album.description = params.description;
    album.year = params.year;
    album.image = 'null';
    album.artist = params.artist;

    album.save((err, albumStored) => {
        if (err) {
            res.status(500).send({ message: 'Error en la petición.' });
        } else {
            if (albumStored) {
                res.status(200).send({ album: albumStored });
            } else {
                res.status(404).send({ message: 'No se ha guardado el album.' });
            }
        }
    });

}

function getAlbums(req, res) {

    var artistId = req.params.artist;

    if (!artistId) {
        // Sacar todos los albums de la base de datos.
        var find = Album.find({}).sort('title');
    } else {
        // Sacar los albums correspondientes al artista.
        var find = Album.find({ artist: artistId }).sort('year');
    }

    find.populate({ path: 'artist' }).exec((err, albums) => {
        if (err) {
            res.status(500).send({ message: 'Error en la petición' });
        } else {
            if (albums) {
                res.status(200).send({ albums });
            } else {
                res.status(404).send({ message: 'No hay albums.' });
            }
        }
    });

}

function update(req, res) {

    var albumId = req.params.id;
    var update = req.body;
    console.log('ENTRAA');

    Album.findByIdAndUpdate(albumId, update, (err, updatedAlbum) => {
        if (err) {
            res.status(500).send({ message: 'No se ha actualizado el album.' });
        } else {
            if (updatedAlbum) {
                res.status(200).send({ album: updatedAlbum });
            } else {
                res.status(404).send({ message: 'No existe el album.' });
            }
        }
    });

}

function deleteAlbum(req, res) {

    var albumId = req.params.id;

    Album.findByIdAndRemove(albumId, (err, albumRemoved) => {
        if (err) {
            res.status(500).send({ message: 'Error al eliminar el album.' });
        } else {
            if (!albumRemoved) {
                res.status(404).send({ message: 'El album no ha sido eliminado.' });
            } else {
                Song.find({ album: albumRemoved._id }).remove((err, songRemoved) => {
                    if (err) {
                        res.status(500).send({ message: 'Error al eliminar la canción.' });
                    } else {
                        if (!songRemoved) {
                            res.status(404).send({ message: 'La canción no ha sido eliminada.' });
                        } else {
                            res.status(200).send({ album: albumRemoved })
                        }
                    }
                });
            }
        }
    });

}

function uploadImage(req, res) {

    var albumId = req.params.id;
    var file_name = 'No subido..';

    if (req.files) {
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if (file_ext.toUpperCase() == 'PNG' || file_ext.toUpperCase() == 'JPG' || file_ext.toUpperCase() == 'GIF') {
            Album.findById(albumId, (err, current_album) => {
                if (err) {
                    res.status(404).send({ message: 'No se ha podido encontrar el album' });
                } else {
                    Album.findByIdAndUpdate(albumId, {image: file_name}, (err, albumUpdated) => {
                        console.log(albumUpdated);
                        if (!albumUpdated) {
                            res.status(400).send({ message: 'No se ha podido actualizar el album' });
                        } else {
                            if (current_album.image != 'null') {
                                fs.exists(UPLOAD_DIR + current_album.image, (exist) => {
                                    if (exist) {
                                        fs.unlink(UPLOAD_DIR + current_album.image, (err, deleted) => {
                                            if (err) {
                                                res.status(500).send({ message: 'Error al eliminar la imagen anterior' });
                                            } else {
                                                res.status(200).send({ album: albumUpdated });
                                            }
                                        });
                                    } else {
                                        res.status(500).send({ message: 'No existe la imagen anterior' });
                                    }
                                });
                            } else {
                                res.status(200).send({ album: albumUpdated });
                            }
                        }
                    });
                }
            });
            
        } else {
            res.status(200).send({ message: 'Extensión no valida, debe ser png, jpg o gif.' });
        }

        console.log(file_path);
    } else {
        res.status(200).send({ message: 'No se ha subido ninguna imagen.' });
    }

}

function getImageFile(req, res) {
    var imageFile = req.params.imageFile;
    var pathFile = UPLOAD_DIR + imageFile;

    fs.exists(pathFile, function(exists) {
        if (exists) {
            res.sendFile(path.resolve(pathFile));
        } else {
            res.status(200).send({ message: 'No existe la imagen...' });
        }
    });
}

module.exports = {
    getAlbum,
    save,
    getAlbums,
    update,
    deleteAlbum,
    uploadImage,
    getImageFile
};