'use strict'

var Artist = require('../models/artist');
var Album = require('../models/album');
var Song = require('../models/song');
var fs = require('fs');
var path = require('path');
var mongoosePaginate = require('mongoose-pagination');

const UPLOAD_DIR = './uploads/artists/';

function getArtist(req, res) {
    var artistId = req.params.id;
    Artist.findById(artistId, (err, artist) => {
        if (err) {
            res.status(500).send({ message: 'Error en la petición.' });
        } else {
            if (!artist) {
                res.status(404).send({ message: 'El artista no existe.' });
            } else {
                res.status(200).send({ artist });
            }
        }
    });
}

function getArtists(req, res) {
    if (req.params.page)
        var page = req.params.page;
    else
        var page = 1;

    var itemsPerPage = 3;
    Artist.find().sort('name').paginate(page, itemsPerPage, (err, artists, total) => {
        if (err) {
            res.status(500).send({ message: 'Error en la petición.' });
        } else {
            if (!artists) {
                res.status(404).send({ message: 'No hay artistas en la base de datos.' });
            } else {
                return res.status(200).send({
                    total: total,
                    artists: artists
                });
            }
        }
    });
}

function save(req, res) {
    var artist = new Artist();
    var params = req.body;
    
    artist.name = params.name;
    artist.description = params.description;
    artist.image = 'null';

    artist.save((err, artistStored) => {
        if (err) {
            res.status(500).send('Error al crear el Artista.');
        } else {
            if (!artistStored) {
                res.status(404).send('El artista no ha sido guardado');
            } else {
                res.status(200).send({ artist: artistStored });
            }
        }
    });
}

function update(req, res) {
    var artistId = req.params.id;
    var update = req.body;

    Artist.findByIdAndUpdate(artistId, update, (err, artist) => {
        if (err) {
            res.status(500).send('Error al guardar el Artista.');
        } else {
            if (!artist) {
                res.status(404).send('El artista no ha sido guardado');
            } else {
                res.status(200).send({ artist: artist });
            }
        }
    });
}

function deleteArtist(req, res) {
    var artistId = req.params.id;
    Artist.findByIdAndRemove(artistId, (err, artistRemoved) => {
        if (err) {
            res.status(500).send({ message: 'Error al eliminar el artista.' });
        } else {
            if (!artistRemoved) {
                res.status(404).send({ message: 'El artista no ha sido eliminado.' });
            } else {
                Album.find({ artist: artistRemoved._id }).remove((err, albumRemoved) => {
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
                                        res.status(200).send({ artist: artistRemoved })
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
    });
}

function uploadImage(req, res) {
    var artistId = req.params.id;
    var file_name = 'No subido..';

    if (req.files) {
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if (file_ext.toUpperCase() == 'PNG' || file_ext.toUpperCase() == 'JPG' || file_ext.toUpperCase() == 'GIF') {
            Artist.findById(artistId, (err, current_artist) => {
                if (err) {
                    res.status(404).send({ message: 'No se ha podido encontrar el artista' });
                } else {
                    Artist.findByIdAndUpdate(artistId, {image: file_name}, (err, artistUpdated) => {
                        if (!artistUpdated) {
                            res.status(400).send({ message: 'No se ha podido actualizar el artista' });
                        } else {
                            if (current_artist.image != 'null') {
                                fs.exists(UPLOAD_DIR + current_artist.image, (exist) => {
                                    if (exist) {
                                        fs.unlink(UPLOAD_DIR + current_artist.image, (err, deleted) => {
                                            if (err) {
                                                res.status(500).send({ message: 'Error al eliminar la imagen anterior' });
                                            } else {
                                                res.status(200).send({ artist: artistUpdated });
                                            }
                                        });
                                    } else {
                                        res.status(500).send({ message: 'No existe la imagen anterior' });
                                    }
                                });
                            } else {
                                res.status(200).send({ artist: artistUpdated });
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
    var pathFile = './uploads/artists/' + imageFile;

    fs.exists(pathFile, function(exists) {
        if (exists) {
            res.sendFile(path.resolve(pathFile));
        } else {
            res.status(200).send({ message: 'No existe la imagen...' });
        }
    });
}

module.exports = {
    getArtist,
    save,
    getArtists,
    update,
    deleteArtist,
    uploadImage,
    getImageFile
}