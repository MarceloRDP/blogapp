const express = require('express');
// componente para criar rotas em arquivos separados
const router = express.Router();
const mongoose = require('mongoose');
require('../models/Categoria');
const Categoria = mongoose.model('categorias');
require('../models/Postagem');
const Postagem = mongoose.model("postagens");
const {eAdmin} = require("../helpers/eAdmin");


//Definindo rotas
//Rota principal para o painel administrativo
router.get('/', eAdmin, (req, res) => {
    res.render('admin/index')
});

// Rota para listar posts
router.get('/posts', eAdmin, (req, res) => {
    res.send("Página de posts")
});

//Rota para listar categorias
router.get('/categorias', eAdmin, (req, res) => {
    // find lista todas as categorias existentes
    Categoria.find().lean().sort({date: 'desc'}).then((categorias) => {
        res.render("admin/categorias", {cat: categorias})
    }).catch((e) => {
        req.flash("error_msg", "Houve um erro ao listar as categorias")
        res.redirect("/admin")
    })
});

router.get('/categorias/add', eAdmin, (req, res) => {
    res.render('admin/addcategorias')
});

router.post('/categorias/nova', eAdmin, (req, res) => {

    var erros = [];

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({texto: "Nome inválido"})
    };

    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
        erros.push({texto: "Slug inválido"})
    };

    if(req.body.nome.length < 2) {
        erros.push({texto: "Nome da categoria é muito pequeno"})
    };

    if (req.body.slug != req.body.slug.replace(/ /g, "")) {
        erros.push({texto: "Slug Nao Pode Conter Espacos!"})
    }
    
    if (req.body.slug != req.body.slug.toLowerCase()) {
        erros.push({texto: "Slug Nao Pode Conter Letras Maiusculas!"})
    };

    if (erros.length > 0) {
        res.render("admin/addcategorias", {erros: erros})
    }

    else {
        const novaCategoria = {
        nome: req.body.nome,
        slug: req.body.slug
        }
        new Categoria(novaCategoria).save().then(() => {
            req.flash("success_msg", "Categoria criada com sucesso!");
            res.redirect("/admin/categorias")
        }).catch((e) => {
            req.flash("error_msg", "Houve um erro ao salvar a categoria, tente novamente!");
            res.redirect("/admin")
        })
    }
});

router.get("/categorias/edit/:id", eAdmin, (req, res) => {
    Categoria.findOne({_id: req.params.id}).lean().then((categoria) => {
        res.render("admin/editcategorias", {categoria: categoria})
    }).catch((e) => {
        req.flash("error_msg", "Essa categoria não existe")
        res.redirect("/admin/categorias")
    })
})

router.post("/categorias/edit", eAdmin, (req, res) => {
    Categoria.findOne({_id: req.body.id}).then((categoria) => {

        categoria.nome = req.body.nome
        categoria.slug = req.body.slug

        categoria.save().then(() => {
            req.flash("success_msg", "Categoria editada com sucesso!")
            res.redirect("/admin/categorias")
        }).catch((e) => {
            req.flash("error_msg", "Houve um erro interno ao salvar a edição da categoria")
            res.redirect("/admin/categorias")
        })
    }).catch((e) => {
        req.flash("error_msg", "Houve um erro ao editar a categoria")
        res.redirect("/admin/categorias")
    })
});

router.post("/categorias/deletar", eAdmin, (req, res) => {
    Categoria.deleteOne({_id: req.body.id}).then(() => {
        req.flash("success_msg", "Categoria deletada com sucesso")
        res.redirect("/admin/categorias")
    }).catch((e) => {
        req.flash("error_msg", "Houve um erro ao deletar a categoria")
        res.redirect("/admin/categorias")
    })
});

//Rota para listar postagens
router.get('/postagens', eAdmin, (req, res) => {
    // find lista todas as postagens existentes
    Postagem.find().lean().populate("categoria").sort({data: 'desc'}).then((postagens) => {
        res.render("admin/postagens", {postagens: postagens})
    }).catch((e) => {
        req.flash("error_msg", "Houve um erro ao listar as postagens")
        res.redirect("/admin")
    })
});

router.get("/postagens/add", eAdmin, (req, res) => {
    Categoria.find().lean().then((categorias) => {
        res.render("admin/addpostagem", {categorias: categorias})
    }).catch((e) => {
        req.flash("error_msg", "Houve um erro ao carregar o formulário")
        res.redirect("/admin")
    })
});

router.post("/postagens/nova", eAdmin, (req, res) => {
    var erros = [];

    if(req.body.categoria == "0") {
        erros.push({texto: "Categoria inválida, registre uma categoria"})
    }

    if(erros.length > 0) {
        res.render("admin/addpostagem", {erros: erros})
    } else {
        const novaPostagem = {
            titulo: req.body.titulo,
            slug: req.body.slug,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria
        }

        new Postagem(novaPostagem).save().then(() => {
            req.flash("success_msg", "Postagem criada com sucesso!")
            res.redirect("/admin/postagens")
        }).catch((e) => {
            req.flash("error_msg", "Houve um erro durante o salvamento da postagem")
            res.redirect("/admin/postagens")
        })
    }
});

router.get("/postagens/edit/:id", eAdmin, (req, res) => {
    Postagem.findOne({_id: req.params.id}).lean().then((postagens) => {

        Categoria.find().lean().then((categorias) => {
            res.render("admin/editpostagens", {categorias: categorias, postagens: postagens})
        }).catch((e) => {
            req.flash("error_msg", "Houve um erro ao listar as categorias")
            res.redirect("/admin/postagens")
        })

    }).catch((e) => {
        req.flash("error_msg", "Essa postagem não existe")
        res.redirect("/admin/postagens")
    })
})

router.post("/postagens/edit", eAdmin, (req, res) => {
    Postagem.findOne({_id: req.body.id}).then((postagens) => {

        postagens.titulo = req.body.titulo
        postagens.slug = req.body.slug
        postagens.descricao = req.body.descricao
        postagens.conteudo = req.body.conteudo
        postagens.categoria = req.body.categoria

        postagens.save().then(() => {
            req.flash("success_msg", "Postagem editada com sucesso!")
            res.redirect("/admin/postagens")
        }).catch((e) => {
            req.flash("error_msg", "Houve um erro interno ao salvar a edição da postagem")
            res.redirect("/admin/postagens")
        })
    }).catch((e) => {
        req.flash("error_msg", "Houve um erro ao editar a postagem")
        res.redirect("/admin/postagens")
    })
});

router.post("/postagens/deletar", eAdmin, (req, res) => {
    Postagem.deleteOne({_id: req.body.id}).lean().then(() => {
        req.flash("success_msg", "Postagem deletada com sucesso")
        res.redirect("/admin/postagens")
    }).catch((e) => {
        req.flash("error_msg", "Houve um erro ao deletar a postagem")
        res.redirect("/admin/postagens")
    })
});

// router.get("/postagens/deletar/:id", (req, res) => {
//     Postagem.deleteOne({_id: req.params.id}).then(() => {
//         req.flash("success_msg", "Postagem deletada com sucesso")
//         res.redirect("/admin/postagens")
//     }).catch((e) => {
//         req.flash("errror_msg", "Houve um erro ao deletar a postagem")
//         res.redirect("/admin/postagens")
//     })
// })
module.exports = router;