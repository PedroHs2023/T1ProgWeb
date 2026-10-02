const mongoose = require('mongoose');

const agendaConfigSchema = new mongoose.Schema({
    diaSemana: {
        type: String,
        required: true,
        enum: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
    },
    horario: {
        type: String,
        required: true
    },
    capacidade: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

agendaConfigSchema.index({ diaSemana: 1, horario: 1 }, { unique: true });

module.exports = mongoose.model('AgendaConfig', agendaConfigSchema, 'configuracoesAgenda');
