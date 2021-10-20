// Carregando módulos
const express = require('express');
const handlebars =  require('express-handlebars');
const mongoose = require('mongoose');
//Path é um módulo para trabalhar com pastas
const path = require('path');
const app = express();
const admin = require('./routes/admin');
const session = require('express-session');
const flash = require('connect-flash');
require("./models/Postagem");
const Postagem = mongoose.model("postagens")
require("./models/Categoria");
const Categoria = mongoose.model("categorias");
const usuarios = require('./routes/usuario');
const passport = require('passport');
require('./config/auth')(passport);
const db = require("./config/db");
var pdf = require('html-pdf');
//Configurações

    //Session - passando um objeto que recebe três parâmetros. O primeiro parâmetro/atributo é uma chave para gerar uma sessão, quanto mais complexo melhor. O resave: força o salvamento da sessão no registro de sessões, mesmo se a sessão não foi modificada durante a requisição. Pode criar problemas quando são feitas duas requisições em paralelo pelo cliente, pois uma requisição pode sobrescrever-se à outra ao fim da requisição, mesmo que não forem feitas mudanças significativas. O saveUnitialized: força o salvamento de uma sessão não inicializada no registro de sessões. Uma sessão é dita não inicializada quando ela é nova, porém não é modificada. A documentação ainda diz que "false" é indicado para logins.

    app.use(session({
        secret:"cursodenode",
        resave: true,
        saveUnitialsized: true
    }))

    app.use(passport.initialize());
    app.use(passport.session());
    //flash
    app.use(flash());

    //Middleware (com variáveis globais)
    app.use((req, res, next) => {
        res.locals.success_msg = req.flash("success_msg");
        res.locals.error_msg = req.flash("error_msg");
        res.locals.error = req.flash("error");
        res.locals.user = req.user || null;
        next();
    })

    //Configurando o express para fazer o que o Body parser fazia
    app.use(express.urlencoded({extended: true}));
    app.use(express.json());

    //Configurando o Handlebars
    app.engine('handlebars', handlebars({defaultLayout: 'main'}));
    app.set('view engine', 'handlebars');

    //Configurando o Mongoose
        mongoose.connect(db.mongoURI).then(() => {
            console.log("Conectado com sucesso!")
        }).catch((e) => {
            console.log("Erro ao se conectar!" + e)
        });

    //Public
    // com esse comando eu estou dizendo ao express que a pasta que está guardando nossos arquivos estáticos é a pasta public
    app.use(express.static(path.join(__dirname, 'public')));

//Rotas
 
    //rotas do grupo admin
    app.use('/admin', admin);
    //rotas do grupo usuários
    app.use('/usuarios', usuarios)

    // rotas da página principal
    app.get('/', (req, res) => {
        Postagem.find().lean().populate("categoria").sort(({data: "desc"})).then((postagens) => {
            res.render("index", {postagens: postagens})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/404")
        })
        
    });

    // app.get("/postagem/:slug", (req, res) => {
    //     Postagem.findOne({slug: req.params.slug}).then((postagem) => {
    //         if(postagem) {
    //             res.render("postagem/index", {postagem: postagem})
    //         } else {
    //             req.flash("error_msg", "Esta postagem não existe")
    //             res.redirect("/")
    //         }
    //     }).catch((e) => {
    //         req.flash("error_msg", "Houve um erro interno")
    //         res.redirect("/")
    //     })
    // })

    app.get("/404", (req, res) => {
        res.send("Erro 404!")
    });

    app.get('/postagem/:slug', (req,res) => {
        const slug = req.params.slug
        Postagem.findOne({slug})
            .then(postagem => {
                if(postagem){
                    const post = {
                        titulo: postagem.titulo,
                        data: postagem.data,
                        conteudo: postagem.conteudo
                    }
                    res.render('postagem/index', post)
                }else{
                    req.flash("error_msg", "Essa postagem nao existe")
                    res.redirect("/")
                }
            })
            .catch(err => {
                req.flash("error_msg", "Houve um erro interno")
                res.redirect("/")
            })
    })

    app.get('/categorias', (req, res) => {
        Categoria.find().lean().then((categorias) => {
            res.render('categorias/index', {categorias: categorias})
        }).catch((e) => {
            req.flash("error_msg", "Houve um erro interno ao listar as categorias")
            res.redirect("/")
        })
    });

    app.get("/categorias/:slug", (req, res) => {
        Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => {
            if (categoria) {
                Postagem.find({categoria: categoria._id}).lean().then((postagens) => {
                    res.render("categorias/postagens", {postagens: postagens, categoria: categoria})
                }).catch((e) => {
                    req.flash("error_msg", "Houve um erro ao listar os posts!")
                    res.redirect("/")
                })
            } else {
                req.flash("error_msg", "Esta categoria não existe")
                res.redirect("/")
            }
        }).catch((e) => {
            req.flash("error_msg", "Houve um erro interno ao carregar a página")
            res.redirect("/")
        })
    });

//Outros
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log("Servidor rodando!")
});