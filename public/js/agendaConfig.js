const campoDiaSemana = document.getElementById('diaSemana');
const campoHorario = document.getElementById('horario');

function atualizarHorariosPermitidos() {
    if (campoDiaSemana.value === 'sabado') {
        campoHorario.min = '08:00';
        campoHorario.max = '15:00';
    } else {
        campoHorario.min = '07:00';
        campoHorario.max = '18:00';
    }

    if (campoHorario.value &&
        (campoHorario.value < campoHorario.min || campoHorario.value > campoHorario.max)) {
        campoHorario.value = '';
    }
}

campoDiaSemana.addEventListener('change', atualizarHorariosPermitidos);
atualizarHorariosPermitidos();
