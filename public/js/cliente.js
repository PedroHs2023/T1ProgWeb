const formulario = document.getElementById('formAgendamento');
const campoData = document.getElementById('data');
const botaoConsultar = document.getElementById('consultarHorarios');
const calendarioSemanal = document.getElementById('calendarioSemanal');
const mensagem = document.getElementById('mensagem');


function obterInicioSemana(dataISO) {
    const data = new Date(`${dataISO}T00:00:00`);
    const diasDesdeSegunda = (data.getDay() + 6) % 7;

    data.setDate(data.getDate() - diasDesdeSegunda);
    return data;
}

function formatarDataISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
}

async function carregarHorarios() {
    const dataEscolhida = campoData.value;
    calendarioSemanal.replaceChildren();

    if (!dataEscolhida) {
        mensagem.textContent = 'Selecione uma data primeiro.';
        return;
    }

    try {
        const inicioSemana = obterInicioSemana(dataEscolhida);
        const nomesDias = [
            'Segunda-feira',
            'Terça-feira',
            'Quarta-feira',
            'Quinta-feira',
            'Sexta-feira',
            'Sábado'
        ];

        for (let indice = 0; indice < nomesDias.length; indice++) {
            const dataDia = new Date(inicioSemana);
            dataDia.setDate(inicioSemana.getDate() + indice);

            const dataISO = formatarDataISO(dataDia);
            const grupoDia = document.createElement('section');
            const tituloDia = document.createElement('h3');

            tituloDia.textContent =`${nomesDias[indice]} - ${dataDia.toLocaleDateString('pt-BR')}`;
            grupoDia.append(tituloDia);

            const resposta = await fetch(
                `/horarios?data=${encodeURIComponent(dataISO)}`
            );
            const horarios = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    horarios.erro || 'Não foi possível consultar os horários.'
                );
            }

            if (horarios.length === 0) {
                const aviso = document.createElement('p');
                aviso.textContent = 'Sem horários disponíveis.';
                grupoDia.append(aviso);
            }

            for (const item of horarios) {
                const opcao = document.createElement('input');
                opcao.type = 'radio';
                opcao.name = 'horario';
                opcao.value = item.horario;
                opcao.dataset.data = dataISO;
                opcao.required = true;

                const label = document.createElement('label');
                label.append(
                    opcao,
                    document.createTextNode(
                        ` ${item.horario} - ${item.vagas} vaga(s)`
                    )
                );

                grupoDia.append(label, document.createElement('br'));
            }

            calendarioSemanal.append(grupoDia);
        }
    } catch (erro) {
        mensagem.textContent = erro.message;
    }
}

botaoConsultar.addEventListener('click', async () => {
    mensagem.textContent = '';
    await carregarHorarios();
});

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const horarioSelecionado = formulario.querySelector(
        'input[name="horario"]:checked'
    );

    if (!horarioSelecionado) {
        mensagem.textContent = 'Consulte e selecione um horário.';
        return;
    }

    const botaoConfirmar = document.getElementById('confirmarAgendamento');
    botaoConfirmar.disabled = true;

    try {
        const resposta = await fetch('/agendar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: formulario.elements.nome.value,
                cpf: formulario.elements.cpf.value,
                data: horarioSelecionado.dataset.data,
                horario: horarioSelecionado.value
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || 'Não foi possível realizar o agendamento.');
        }

        mensagem.textContent = resultado.mensagem;
        await carregarHorarios();
    } catch (erro) {
        mensagem.textContent = erro.message;
    } finally {
        botaoConfirmar.disabled = false;
    }
});