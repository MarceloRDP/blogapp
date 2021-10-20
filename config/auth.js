const localStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

//Model de usuário
require('../models/Usuario')
const Usuario = mongoose.model('usuarios');

module.exports = function(passport) {
    //se no formulário de login o name senha estivesse em inglês 'password' não seria necessário repassar o passwordField pois o reconhecimento seria automático
    passport.use(new localStrategy({usernameField: 'email', passwordField: 'senha'}, (email, senha, done) => {
        Usuario.findOne({email: email}).then((usuario) => {
            if (!usuario) {
                //parâmetros done: dados da conta, se a conta foi autenticada com sucesso e mensagem
                return done(null, false, {message: "Esta conta não existe"})
            }

            bcrypt.compare(senha, usuario.senha, (erro, batem) => {
                if (batem) {
                    return done(null, usuario)
                }else {
                    return done(null, false, {message: "Senha incorreta"})
                }
            })
        })
    }))
    //salva os dados de usuário em uma sessão
    passport.serializeUser((usuario, done) => {
        done(null, usuario.id)
    })

    //apaga os dados de usuário da sessão ( não tenho certeza se é isso)
    passport.deserializeUser((id, done) => {
        Usuario.findById(id, (err, usuario) => {
            done(err, usuario)
        })
    })
}