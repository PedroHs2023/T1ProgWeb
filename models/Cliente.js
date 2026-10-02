const mongoose = require("mongoose");

const clienteSchema = new mongoose.Schema({
    nome:{
        type: String,
        required: true,
        trim: true
    },
    cpf:{
        type: String,
        required: true,
        unique: true
    }
});

module.exports = mongoose.model("Cliente", clienteSchema, "clientes");