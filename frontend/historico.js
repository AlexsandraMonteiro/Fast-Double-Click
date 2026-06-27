/*
=========================================================
HISTORY.JS - REGISTRADOR DE TEMPOS (FRONTEND - PAGINA DE HISTORICO)
=========================================================

Este arquivo contem a logica de frontend para a pagina de historico
da aplicacao Registrador de Tempos.

Funcionalidades:
- Carregamento e exibicao de registros
- Filtros por descricao, data de inicio e data de fim
- Ordenacao por data/hora ou descricao
- Remocao de registros individuais
- Feedback visual de carregamento e resultados

=========================================================
*/

// =========================================================
// 1. REFERENCIAS AOS ELEMENTOS DO DOM
// =========================================================

// Obtem referencias para os elementos do formulario de filtros
const formBusca = document.getElementById('busca');
const formDataInicio = document.getElementById('data-inicio');
const formDataFim = document.getElementById('data-fim');
const formOrdenar = document.getElementById('ordenar');
const botaoFiltrar = document.getElementById('botao-filtrar');
const botaoLimpar = document.getElementById('botao-limpar');
const areaResultados = document.getElementById('area-resultados');
const elContagem = document.getElementById('contagem');

// Verifica se os elementos foram encontrados
console.log('Elementos do historico:', {
  formBusca: !!formBusca,
  formDataInicio: !!formDataInicio,
  formDataFim: !!formDataFim,
  formOrdenar: !!formOrdenar,
  botaoFiltrar: !!botaoFiltrar,
  botaoLimpar: !!botaoLimpar,
  areaResultados: !!areaResultados,
  elContagem: !!elContagem
});

// =========================================================
// 2. VARIAVEIS GLOBAIS
// =========================================================

let timeoutBusca = null;

// =========================================================
// 3. FORMATADORES
// =========================================================

const formatadorHora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const formatadorDataCurta = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

// =========================================================
// 4. FUNCOES AUXILIARES
// =========================================================

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function montarQueryString() {
  const params = new URLSearchParams();

  const busca = formBusca ? formBusca.value.trim() : '';
  if (busca) params.set('busca', busca);

  if (formDataInicio && formDataInicio.value) params.set('dataInicio', formDataInicio.value);
  if (formDataFim && formDataFim.value) params.set('dataFim', formDataFim.value);

  if (formOrdenar) {
    const [campo, ordem] = formOrdenar.value.split('-');
    params.set('ordenarPor', campo);
    params.set('ordem', ordem);
  }

  return params.toString();
}

// =========================================================
// 5. FUNCOES PRINCIPAIS
// =========================================================

async function carregarRegistros() {
  console.log('Carregando historico...');
  
  if (areaResultados) {
    areaResultados.innerHTML = '<p class="carregando">Carregando registros...</p>';
  }

  try {
    const query = montarQueryString();
    console.log('Query:', query);
    
    const resposta = await fetch(`/api/registros?${query}`);
    
    if (!resposta.ok) throw new Error('Falha ao buscar registros');

    const registros = await resposta.json();
    console.log(`${registros.length} registros carregados no historico`);
    renderizarResultados(registros);
    
  } catch (erro) {
    console.error('Erro ao carregar historico:', erro);
    if (areaResultados) {
      areaResultados.innerHTML = `
        <div class="estado-vazio">
          Nao foi possivel carregar o historico. 
          Verifique se o servidor esta rodando e tente novamente.
        </div>
      `;
    }
    if (elContagem) elContagem.textContent = '';
  }
}

function renderizarResultados(registros) {
  console.log('Renderizando resultados:', registros.length);
  
  // Atualiza a contagem
  if (elContagem) {
    elContagem.innerHTML = `
      <strong>${registros.length}</strong> 
      ${registros.length === 1 ? 'registro encontrado' : 'registros encontrados'}
    `;
  }

  if (!areaResultados) {
    console.error('Area de resultados nao encontrada!');
    return;
  }

  // Se nao ha registros, exibe estado vazio
  if (registros.length === 0) {
    const filtrosAtivos = (formBusca && formBusca.value) || 
                          (formDataInicio && formDataInicio.value) || 
                          (formDataFim && formDataFim.value);
    areaResultados.innerHTML = `
      <div class="estado-vazio">
        ${filtrosAtivos
          ? 'Nenhum registro corresponde aos filtros aplicados. Ajuste a busca ou limpe os filtros.'
          : 'Nenhum registro ainda. <a href="/">Registre o primeiro tempo</a>.'}
      </div>`;
    return;
  }

  // Cria o container da lista de registros
  const livro = document.createElement('div');
  livro.className = 'livro';

  // Para cada registro, cria um elemento na lista
  registros.forEach((registro, index) => {
    const data = new Date(registro.dataHora);
    const entrada = document.createElement('div');
    entrada.className = 'entrada';
    entrada.dataset.id = registro.id;
    entrada.style.animationDelay = `${index * 0.05}s`;

    const descricaoHTML = registro.descricao
      ? `<span class="descricao">${escaparHTML(registro.descricao)}</span>`
      : `<span class="descricao vazio">sem descricao</span>`;

    entrada.innerHTML = `
      <div class="bloco-hora">
        <div class="hora">${formatadorHora.format(data)}</div>
        <div class="data">${formatadorDataCurta.format(data)}</div>
      </div>
      <div class="traco"></div>
      ${descricaoHTML}
      <button class="botao-remover" title="Remover registro" aria-label="Remover registro">✕</button>
    `;

    const botaoRemover = entrada.querySelector('.botao-remover');
    if (botaoRemover) {
      botaoRemover.addEventListener('click', (e) => {
        e.stopPropagation();
        removerRegistro(registro.id);
      });
    }

    livro.appendChild(entrada);
  });

  areaResultados.innerHTML = '';
  areaResultados.appendChild(livro);
  
  console.log('Resultados renderizados com sucesso!');
}

async function removerRegistro(id) {
  console.log('Removendo registro:', id);
  
  try {
    const resposta = await fetch(`/api/registros/${encodeURIComponent(id)}`, { 
      method: 'DELETE' 
    });
    
    if (!resposta.ok) throw new Error('Falha ao remover');
    
    console.log('Registro removido com sucesso');
    carregarRegistros();
    
  } catch (erro) {
    console.error('Erro ao remover:', erro);
    alert('Nao foi possivel remover este registro. Tente novamente.');
  }
}

// =========================================================
// 6. EVENT LISTENERS DOS FILTROS
// =========================================================

// Busca com debounce
if (formBusca) {
  formBusca.addEventListener('input', () => {
    clearTimeout(timeoutBusca);
    timeoutBusca = setTimeout(carregarRegistros, 300);
  });
}

// Mudancas nas datas
if (formDataInicio) {
  formDataInicio.addEventListener('change', carregarRegistros);
}

if (formDataFim) {
  formDataFim.addEventListener('change', carregarRegistros);
}

// Mudanca na ordenacao
if (formOrdenar) {
  formOrdenar.addEventListener('change', carregarRegistros);
}

// Botao Filtrar
if (botaoFiltrar) {
  botaoFiltrar.addEventListener('click', carregarRegistros);
}

// Botao Limpar
if (botaoLimpar) {
  botaoLimpar.addEventListener('click', () => {
    if (formBusca) formBusca.value = '';
    if (formDataInicio) formDataInicio.value = '';
    if (formDataFim) formDataFim.value = '';
    if (formOrdenar) formOrdenar.value = 'dataHora-desc';
    carregarRegistros();
  });
}

// Submit do formulario
const formFiltros = document.getElementById('form-filtros');
if (formFiltros) {
  formFiltros.addEventListener('submit', (evento) => {
    evento.preventDefault();
    carregarRegistros();
  });
}

// =========================================================
// 7. CARREGAMENTO INICIAL
// =========================================================

console.log('Historico - Inicializado');
console.log('URL atual:', window.location.href);

// Carrega os registros ao abrir a pagina
carregarRegistros();

// =========================================================
// 8. EXPORTACOES (para testes)
// =========================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escaparHTML,
    montarQueryString,
    carregarRegistros,
    renderizarResultados,
    removerRegistro,
  };
}