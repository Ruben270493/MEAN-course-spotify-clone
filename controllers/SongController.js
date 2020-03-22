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
    var albumId = req.params.album;

    if (albumId) {
        var find = Song.find({ album: albumId }).sort('number');
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

module.exports = {
    getSong,
    save,
    getSongs,
    update
}