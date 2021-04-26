'use strict';
require('dotenv').config();
const express = require('express');
const app = express();
const superagent = require('superagent');
const pg = require('pg');
const methodoverride = require('method-override');
const cors = require('cors');
app.use(methodoverride('_method'));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    // ssl:
    // {
    //     rejectUnauthorized: false
    // }
});
const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
    let url = 'https://thesimpsonsquoteapi.glitch.me/quotes?count=10';
    superagent.get(url)
        .set('User-Agent', '1.0')
        .then(result => {
            // console.log(result);
            let data = result.body.map(data => {
                return new Simp(data);
            });
            res.render('home', { data: data });
        })
        .catch(err => {
            res.render('err', { err: err });
        });
});

app.post('/savetodb', (req, res) => {
    let sql = 'insert into simpsons (quote,character,image,characterDirection) values ($1,$2,$3,$4) returning *;';
    let { quote, character, image, characterDirection } = req.body;
    let safeVals = [quote, character, image, characterDirection];
    client.query(sql, safeVals)
        .then(result => {
            res.redirect('/savedqoutes');
        })
        .catch(err => {
            res.render('err', { err: err });
        });
});

app.get('/savedqoutes', (req, res) => {
    let sql = 'select * from simpsons;';
    client.query(sql)
        .then(result => {
            // console.log(result.rows)
            res.render('savedqoutes', { data: result.rows });
        })
        .catch(err => {
            res.render('err', { err: err });
        });
});

app.get('/showdatails/:id', (req, res) => {
    let sql = 'select * from simpsons where id=$1;';
    let safeVal = [req.params.id];
    client.query(sql, safeVal)
        .then(result => {
            res.render('details', { data: result.rows });
        })
        .catch(err => {
            res.render('err', { err: err });
        });
});

app.put('/update/:id', (req, res) => {
    let sql = 'update simpsons set quote=$1, character=$2, image=$3, characterDirection=$4 where id=$5';
    let { quote, character, image, characterDirection } = req.body;
    let safeVals = [quote, character, image, characterDirection, req.params.id];
    console.log('hi');
    client.query(sql, safeVals)
        .then(result => {
            console.log(result);
            res.redirect(`/showdatails/${req.params.id}`)

                .catch(err => {
                    res.render('err', { err: err });
                });
        });
});

app.delete('/delete/:id', (req, res) => {

    let sql = 'delete from simpsons where id=$1;';
    let safeVal = [req.params.id]
    client.query(sql,safeVal)
        .then(() => {
            res.redirect('/savedqoutes');
        })
        .catch(err => {
            res.render('err', { err: err });
        });
});


function Simp(data) {
    this.quote = data.quote;
    this.character = data.character;
    this.characterDirection = data.characterDirection;
    this.image = data.image;
}

client.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`up to port ${PORT}`);
        });
    });

