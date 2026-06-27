/*
=========================================================
SCRIPT.JS - REGISTRADOR DE TEMPOS (FRONTEND - PAGINA INICIAL)
=========================================================

Este arquivo contem a logica de frontend para a pagina inicial
da aplicacao Registrador de Tempos.

Funcionalidades:
- Registro de pontos com envio para a API
- Feedback visual para o usuario

=========================================================
*/

// =========================================================
// 1. REFERENCIAS AOS ELEMENTOS DO DOM
// =========================================================

// Obtem referencias para os elementos do formulario
const botaoRegistrar = document.getElementById('botao-registrar');
const campoDescricao = document.getElementById('descricao');
const campoData = document.getElementById('dataRegistro');
const campoHora = document.getElementById('horaRegistro');
const elConfirmacao = document.getElementById('confirmacao');

// =========================================================
// 2. FORMATADORES
// =========================================================

// Formatador para hora (HH:MM:SS)
const formatadorHora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

// Formatador para data curta (DD/MM/YYYY)
const formatadorDataCurta = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

// =========================================================
// 3. FUNCOES AUXILIARES
// =========================================================

/**
 * Mostra uma mensagem de confirmacao na interface
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {boolean} comoErro - Se true, exibe como erro
 */
function mostrarConfirmacao(mensagem, comoErro = false) {
  if (!elConfirmacao) {
    console.warn('Elemento de confirmacao nao encontrado');
    return;
  }

  elConfirmacao.textContent = mensagem;
  elConfirmacao.classList.toggle('erro', comoErro);
  elConfirmacao.classList.add('visivel');
  
  // Remove a mensagem apos 5 segundos
  clearTimeout(elConfirmacao.timeout);
  elConfirmacao.timeout = setTimeout(() => {
    elConfirmacao.classList.remove('visivel');
  }, 5000);
}

// =========================================================
// 4. FUNCAO PRINCIPAL DE REGISTRO
// =========================================================

/**
 * Envia um novo registro para a API
 */
async function registrarTempo() {
  // Obtem os valores dos campos
  const data = campoData ? campoData.value : '';
  const hora = campoHora ? campoHora.value : '';
  const descricao = campoDescricao ? campoDescricao.value.trim() : '';

  console.log('Dados do formulario:', { data, hora, descricao });

  // Validacao dos campos obrigatorios
  if (!data) {
    mostrarConfirmacao('Por favor, selecione uma data.', true);
    if (campoData) campoData.focus();
    return;
  }

  if (!hora) {
    mostrarConfirmacao('Por favor, selecione uma hora.', true);
    if (campoHora) campoHora.focus();
    return;
  }

  // Desabilita o botao e adiciona efeito visual
  if (botaoRegistrar) {
    botaoRegistrar.disabled = true;
    botaoRegistrar.classList.add('pressionando');
  }

  try {
    // Prepara os dados para envio
    const dadosParaEnviar = {
      data: data,
      hora: hora,
      descricao: descricao
    };

    console.log('Enviando para API:', dadosParaEnviar);

    // Envia requisicao POST para a API
    const resposta = await fetch('/api/registros', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(dadosParaEnviar),
    });

    console.log('Resposta da API:', resposta.status, resposta.statusText);

    // Verifica se a resposta foi bem-sucedida
    if (!resposta.ok) {
      const erro = await resposta.json();
      console.error('Erro da API:', erro);
      throw new Error(erro.erro || 'Falha ao registrar');
    }

    // Obtem o registro criado
    const registroCriado = await resposta.json();
    console.log('Registro criado:', registroCriado);

    // Exibe mensagem de confirmacao
    const dataObj = new Date(registroCriado.dataHora);
    mostrarConfirmacao(`Registrado em ${formatadorDataCurta.format(dataObj)} as ${formatadorHora.format(dataObj)}`);
    
    // Limpa os campos
    if (campoDescricao) campoDescricao.value = '';
    if (campoData) campoData.value = '';
    if (campoHora) campoHora.value = '';

  } catch (erro) {
    // Em caso de erro, exibe mensagem de erro
    console.error('Erro ao registrar:', erro);
    mostrarConfirmacao(erro.message || 'Nao foi possivel registrar. Tente novamente.', true);
  } finally {
    // Reabilita o botao e remove efeito visual
    if (botaoRegistrar) {
      botaoRegistrar.disabled = false;
      botaoRegistrar.classList.remove('pressionando');
    }
  }
}

// =========================================================
// 5. EVENT LISTENERS
// =========================================================

// Evento de clique no botao Registrar
if (botaoRegistrar) {
  botaoRegistrar.addEventListener('click', registrarTempo);
} else {
  console.warn('Botao Registrar nao encontrado');
}

// Evento de tecla Enter no campo de descricao
if (campoDescricao) {
  campoDescricao.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      registrarTempo();
    }
  });
}

// Evento de tecla Enter nos campos de data e hora
if (campoData) {
  campoData.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      if (campoHora) campoHora.focus();
    }
  });
}

if (campoHora) {
  campoHora.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      registrarTempo();
    }
  });
}

// =========================================================
// 6. INICIALIZACAO
// =========================================================

console.log('Registrador de Tempos - Inicializado');

// =========================================================
// 7. EXPORTACOES (para testes)
// =========================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mostrarConfirmacao,
    registrarTempo,
  };
}