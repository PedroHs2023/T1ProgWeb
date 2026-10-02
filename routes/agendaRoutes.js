const express = require('express');
const router = express.Router();
const AgendaConfig = require('../models/AgendaConfig');
const Agendamento = require('../models/Agendamento');

router.get('/ajustaPetAgenda', async (req, res) => {
    try {
        const configuracoes = await AgendaConfig.find().sort({ diaSemana: 1, horario: 1 }).lean();
        res.render('ajustaAgenda', {
            title: 'Ajustar agenda',
            configuracoes
        });
    } catch (error) {
        res.status(500).send('Erro ao carregar agenda');
    }
});

router.post('/ajustaPetAgenda', async (req, res) => {
    try {
        const { diaSemana, horario, capacidade } = req.body;
        const diasAtendidos = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const capacidadeNumerica = Number(capacidade);
        const horarioValido = typeof horario === 'string' &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(horario);
        const dentroExpediente = diaSemana === 'sabado'
            ? horario >= '08:00' && horario <= '15:00'
            : horario >= '07:00' && horario <= '18:00';

        if (
            !diasAtendidos.includes(diaSemana) ||
            !horarioValido ||
            !dentroExpediente ||
            capacidade === '' ||
            !Number.isInteger(capacidadeNumerica) ||
            capacidadeNumerica < 0
        ) {
            return res.status(400).send('Informe dia, horário e capacidade válidos');
        }

        await AgendaConfig.findOneAndUpdate(
            { diaSemana, horario },
            { diaSemana, horario, capacidade: capacidadeNumerica },
            { upsert: true, returnDocument: 'after', runValidators: true }
        );

        res.redirect('/ajustaPetAgenda');
    } catch (error) {
        res.status(500).send('Erro ao salvar agenda');
    }
});

router.get('/listaPetAgenda', async (req, res) =>{
    
    try{
        const agendamentos = await Agendamento.find()
            .populate('clienteId', 'nome cpf')
            .sort({data:1, horario:1 })
            .lean();
        
        res.render('listaPetAgenda', {
            title: 'Agenda do Pet Shop',
            agendamentos
        });
    }catch(error){
        res.status(500).send('Erro ao listar agenda');
    }
});



module.exports = router;
