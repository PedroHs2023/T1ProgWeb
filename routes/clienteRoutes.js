const express = require('express');
const router = express.Router();
const AgendaConfig = require('../models/AgendaConfig');
const Agendamento = require('../models/Agendamento');
const Cliente = require('../models/Cliente');
const SlotOcupacao = require('../models/SlotOcupacao');

function getDiaSemana(data) {
    const dia = new Date(data + 'T00:00:00');
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return dias[dia.getDay()];
}

function horarioPermitido(diaSemana, horario) {
    if (diaSemana === 'domingo') {
        return false;
    }

    if (typeof horario !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) {
        return false;
    }

    if (diaSemana === 'sabado') {
        return horario >= '08:00' && horario <= '15:00';
    }

    return horario >= '07:00' && horario <= '18:00';
}

router.get('/horarios', async (req, res) => {
    try {
        const { data } = req.query;

        if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
            return res.status(400).json({ erro: 'Data inválida' });
        }

        const [ano, mes, dia] = data.split('-').map(Number);
        const dataSelecionada = new Date(ano, mes - 1, dia);

        if (
            dataSelecionada.getFullYear() !== ano ||
            dataSelecionada.getMonth() !== mes - 1 ||
            dataSelecionada.getDate() !== dia
        ) {
            return res.status(400).json({ erro: 'Data inválida' });
        }

        const diaSemana = getDiaSemana(data);

        if (diaSemana === 'domingo') {
            return res.json([]);
        }

        const configuracoes = await AgendaConfig.find({ diaSemana });
        const horariosDisponiveis = [];
        const agora = new Date();

        for (const item of configuracoes) {
            if (!horarioPermitido(diaSemana, item.horario)) {
                continue;
            }

            const dataHoraHorario = new Date(`${data}T${item.horario}:00`);

            if (
                Number.isNaN(dataHoraHorario.getTime()) ||
                dataHoraHorario <= agora
            ) {
                continue;
            }

            const agendamentos = await Agendamento.countDocuments({
                data,
                horario: item.horario
            });

            const vagas = item.capacidade - agendamentos;

            if (vagas > 0) {
                horariosDisponiveis.push({
                    horario: item.horario,
                    vagas
                });
            }
        }

        return res.json(horariosDisponiveis);
    } catch (error) {
        return res.status(500).json({ erro: 'Erro ao consultar horários' });
    }
});

router.post('/agendar', async (req, res) => {
    try {
        const { nome, cpf, data, horario } = req.body;

        if (!nome || !cpf || !data || !horario) {
            return res.status(400).json({ erro: 'Nome, CPF, data e horário são obrigatórios' });
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
            return res.status(400).json({ erro: 'Data inválida' });
        }

        const [ano, mes, dia] = data.split('-').map(Number);
        const dataSelecionada = new Date(ano, mes - 1, dia);
        if (dataSelecionada.getFullYear() !== ano ||
            dataSelecionada.getMonth() !== mes - 1 ||
            dataSelecionada.getDate() !== dia) {
            return res.status(400).json({ erro: 'Data inválida' });
        }

        const diaSemana = getDiaSemana(data);

        if (diaSemana === 'domingo') {
            return res.status(400).json({ erro: 'Domingo não possui atendimento' });
        }

        if (!horarioPermitido(diaSemana, horario)) {
            return res.status(400).json({ erro: 'Horário fora do expediente' });
        }

        const configuracao = await AgendaConfig.findOne({ diaSemana, horario });

        if (!configuracao) {
            return res.status(400).json({ erro: 'Horário não configurado' });
        }

        const dataHora = new Date(`${data}T${horario}:00`);
        if (dataHora <= new Date()) {
            return res.status(400).json({ erro: 'Não é possível agendar em uma data ou horário passado' });
        }

        const agendamentosExistentes = await Agendamento.countDocuments({
            data,
            horario
        });

        try {
            await SlotOcupacao.updateOne(
                { data, horario },
                {
                    $setOnInsert: {
                        data,
                        horario,
                        capacidade: configuracao.capacidade,
                        reservados: agendamentosExistentes
                    }
                },
                { upsert: true }
            );
        } catch (erro) {
            if (erro.code !== 11000) {
                throw erro;
            }
        }

        const slotReservado = await SlotOcupacao.findOneAndUpdate(
            {
                data,
                horario,
                reservados: { $lt: configuracao.capacidade }
            },
            {
                $set: { capacidade: configuracao.capacidade },
                $inc: { reservados: 1 }
            },
            { returnDocument: 'after' }
        );

        if (!slotReservado) {
            return res.status(400).json({ erro: 'Horário indisponível' });
        }

        try {
            let cliente = await Cliente.findOne({ cpf });

            if (!cliente) {
                cliente = await Cliente.create({ nome, cpf });
            }

            await Agendamento.create({
                clienteId: cliente._id,
                data,
                horario,
                status: 'confirmado'
            });
        } catch (erro) {
            await SlotOcupacao.updateOne(
                { data, horario, reservados: { $gt: 0 } },
                { $inc: { reservados: -1 } }
            );

            throw erro;
        }

        return res.status(201).json({ mensagem: 'Agendamento realizado com sucesso!' });

    } catch (error) {
        return res.status(500).json({ erro: 'Erro ao realizar agendamento' });
    }
});

module.exports = router;