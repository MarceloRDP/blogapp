if(process.env.node == "production") {
    module.exports = {mongoURI: "mongodb+srv://marcelo11:Wore141Sum982@cluster0.4nfud.mongodb.net/blogapp?retryWrites=true&w=majority"}
}else {
    module.exports = {mongoURI: "mongodb://localhost/blogapp"}
}