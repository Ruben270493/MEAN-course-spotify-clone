'use strict'

var Artist = require('../models/artist');
var Album = require('../models/album');
var Song = require('../models/song');
var fs = require('fs');
var path = require('path');
var mongoosePaginate = require('mongoose-pagination');

const UPLOAD_DIR = './uploads/songs/';

function getSong(req, res) {
    var songId = req.params.id;
    
    Song.findById(songId).populate({ path: 'album' }).exec((err, song) => {
        if (err) {
            res.status(500).send({ message: 'Error en la petición.' });
        } else {
            if (song) {
                res.status(200).send({ song });
            } else {
                res.status(404).send({ message: 'La canción no existe en la base de datos.' });
            }
        }
    });
}

function save(req, res) {
    var song = new Song();
    var params = req.body;

    song.name = params.name;
    song.number = params.number;
    song.duration = params.duration;
    song.file = 'null';
    song.album = params.album;

    song.save((err, songStored) => {
        if (err) {
            res.status(500).send({ message: 'No se ha podido guardar la canción' });
        } else {
            if (songStored) {
                res.status(200).send({ song: songStored });
            } else {
                res.status(500).send({ message: 'Error en la petición.' });
            }
        }
    });
}

function getSongs(req, res) {
    var songId = req.params.album;

    if (songId) {
        var find = Song.find({ album: songId }).sort('number');
    } else {
        var find = Song.find({}).sort('number');
    }

    find.populate({
        path: 'album',
        populate: {
            path: 'artist',
            model: 'Artist'
        }
    }).exec((err, songs) => {
        if (err) {
            res.status(500).send({ message: 'Error en la petición.' });
        } else {
            if (songs) {
                res.status(200).send({ songs });
            } else {
                res.status(404).send({ message: 'No hay canciones en la base de datos.' });
            }
        }
    });
}

function update(req, res) {
    var songId = req.params.id;
    var update = req.body;

    Song.findByIdAndUpdate(songId, update, (err, updatedSong) => {
        if (err) {
            res.status(500).send({ message: 'Error en el servidor.' });
        } else {
            if (updatedSong) {
                res.status(200).send({ song: updatedSong });
            } else {
                res.status(404).send({ message: 'No se ha actualizado la canción. '});
            }
        }
    });
}

function deleteSong(req, res) {
    var songId = req.params.id;

    Song.findByIdAndRemove(songId, (err, song) => {
        if (err) {
            res.status(500).send({ message: 'Error en el servidor.' });
        } else {
            if (song) {
                res.status(200).send({ song });
            } else {
                res.status(404).send({ message: 'No se ha borrado la canción. '});
            }
        }
    });
}

function uploadFile(req, res) {

    var songId = req.params.id;
    var file_name = 'No subido..';

    if (req.files) {
        var file_path = req.files.file.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if (file_ext.toUpperCase() == 'MP3' || file_ext.toUpperCase() == 'Mp4' || file_ext.toUpperCase() == 'OGG') {
            Song.findById(songId, (err, current_song) => {
                if (err) {
                    res.status(404).send({ message: 'No se ha podido encontrar la canción' });
                } else {
                    Song.findByIdAndUpdate(songId, {file: file_name}, (err, songUpdated) => {
                        console.log(songUpdated);
                        if (!songUpdated) {
                            res.status(400).send({ message: 'No se ha podido actualizar la canción' });
                        } else {
                            if (current_song.image != 'null') {
                                fs.exists(UPLOAD_DIR + current_song.file, (exist) => {
                                    if (exist) {
                                        fs.unlink(UPLOAD_DIR + current_song.file, (err, deleted) => {
                                            if (err) {
                                                res.status(500).send({ message: 'Error al eliminar la canción anterior' });
                                            } else {
                                                res.status(200).send({ song: songUpdated });
                                            }
                                        });
                                    } else {
                                        res.status(200).send({ song: songUpdated });
                                    }
                                });
                            } else {
                                res.status(200).send({ song: songUpdated });
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

function getSongFile(req, res) {
    var songFile = req.params.songFile;
    var pathFile = UPLOAD_DIR + songFile;

    fs.exists(pathFile, function(exists) {
        if (exists) {
            res.sendFile(path.resolve(pathFile));
        } else {
            res.status(200).send({ message: 'No existe la canción...' });
        }
    });
}

module.exports = {
    getSong,
    save,
    getSongs,
    update,
    deleteSong,
    uploadFile,
    getSongFile
}