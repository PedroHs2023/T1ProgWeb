const mongoose = require('mongoose');

const slotOcupacaoSchema = new mongoose.Schema({
    
    data:{
        type: String,
        required: true,
        match: /^\d{4}-\d{2}-\d{2}$/
    },
    horario:{
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):[0-5]\d$/
    },
    capacidade:{
        type: Number,
        required: true,
        min: 0
    },
    reservados:{
        type: Number,
        required: true,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

slotOcupacaoSchema.index(
    {data: 1, horario: 1},
    {unique: true}
);

module.exports = mongoose.model(
    'SlotOcupacao',
    slotOcupacaoSchema,
    'slotsOcupacao'
);