const mongoose = require('mongoose');

const agendamentoSchema = new mongoose.Schema({
    clienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',
        required: true
    },
    data: {
        type: String,
        required: true
    },
    horario: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'confirmado'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Agendamento', agendamentoSchema, 'agendamentos');
