/*
=========================================================
SERVER.JS - REGISTRADOR DE TEMPOS
=========================================================

Arquivo de servidor backend para a aplicacao Registrador de Tempos.
Utiliza Node.js com modulos nativos (HTTP, FS, PATH, CRYPTO).

Funcionalidades:
- Servir arquivos estaticos (HTML, CSS, JS)
- API REST para gerenciar registros de ponto
- Filtros e ordenacao de registros
- Persistencia em arquivo JSON

=========================================================
*/

// =========================================================
// 1. IMPORTACAO DE MODULOS
// =========================================================

const http = require('http'); // Importa o modulo HTTP para criar o servidor
const fs = require('fs'); // Importa o modulo File System para manipular arquivos
const path = require('path'); // Importa o modulo Path para trabalhar com caminhos de arquivos
const crypto = require('crypto'); // Importa o modulo Crypto para gerar IDs unicos (UUID)

// =========================================================
// 2. CONFIGURACOES DO SERVIDOR
// =========================================================

const PORT = process.env.PORT || 3000; // Define a porta do servidor (variavel de ambiente ou 3000)

// Define o caminho para o banco de dados (dentro da pasta backend/data/)
const DB_PATH = path.join(__dirname, 'data', 'registros.json');

// Define o diretorio dos arquivos estaticos (pasta frontend/ que esta no mesmo nivel de backend/)
const PUBLIC_DIR = path.join(__dirname, '..', 'frontend');

console.log('====================================================');
console.log('CONFIGURACOES DO SERVIDOR');
console.log('====================================================');
console.log(`Diretorio backend: ${__dirname}`);
console.log(`Diretorio frontend: ${PUBLIC_DIR}`);
console.log(`Banco de dados: ${DB_PATH}`);
console.log('====================================================');

// =========================================================
// 3. FUNCOES DE PERSISTENCIA (BANCO DE DADOS JSON)
// =========================================================

/**
 * Le os registros do arquivo JSON
 * @returns {Array} Array de registros
 */
function readDB() {
    // Verifica se o arquivo existe
    if (!fs.existsSync(DB_PATH)) {
        // Cria o diretorio se nao existir
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true }); // Cria o diretorio recursivamente
        }
        // Cria o arquivo com um array vazio
        fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2), 'utf-8');
        return [];
    }

    try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8'); // Le o arquivo de banco de dados sincronamente
        const data = JSON.parse(raw || '[]'); // Tenta parsear o JSON, se vazio usa array vazio
        return Array.isArray(data) ? data : []; // Verifica se eh array, se nao retorna array vazio
    } catch (error) {
        console.error('Erro ao ler banco de dados:', error); // Log do erro
        return []; // Em caso de erro, retorna array vazio
    }
}

/**
 * Escreve os registros no arquivo JSON
 * @param {Array} registros - Array de registros
 */
function writeDB(registros) {
    try {
        // Garante que o diretorio existe
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true }); // Cria o diretorio recursivamente
        }
        // Escreve o arquivo com formatacao (indentacao de 2 espacos)
        fs.writeFileSync(DB_PATH, JSON.stringify(registros, null, 2), 'utf-8');
    } catch (error) {
        console.error('Erro ao escrever banco de dados:', error); // Log do erro
        throw error; // Lanca o erro para ser tratado por quem chamou a funcao
    }
}

// =========================================================
// 4. FUNCOES DE UTILIDADE PARA REQUISICOES
// =========================================================

/**
 * Envia uma resposta JSON
 * @param {Object} res - Objeto de resposta HTTP
 * @param {number} status - Codigo de status HTTP
 * @param {*} payload - Dados a serem enviados
 */
function sendJSON(res, status, payload) {
    const body = JSON.stringify(payload); // Converte o payload para string JSON
    res.writeHead(status, { // Define o status HTTP e os headers
        'Content-Type': 'application/json; charset=utf-8', // Indica que a resposta eh JSON
        'Content-Length': Buffer.byteLength(body), // Define o tamanho do conteudo
        'Access-Control-Allow-Origin': '*', // Permite CORS para desenvolvimento
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', // Metodos permitidos
        'Access-Control-Allow-Headers': 'Content-Type', // Headers permitidos
    });
    res.end(body); // Envia a resposta
}

/**
 * Le o corpo da requisicao como JSON
 * @param {Object} req - Objeto de requisicao HTTP
 * @returns {Promise<Object>} Promise com o corpo parseado
 */
function readBody(req) {
    return new Promise((resolve, reject) => { // Retorna uma Promise para ler o corpo da requisicao assincronamente
        const chunks = []; // Array para armazenar os chunks de dados
        
        req.on('data', (chunk) => chunks.push(chunk)); // Coleta os dados recebidos
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf-8'); // Concatena e converte para string
            if (!raw) return resolve({}); // Se vazio, resolve com objeto vazio
            
            try {
                resolve(JSON.parse(raw)); // Tenta parsear como JSON e resolve
            } catch (err) {
                reject(new Error('JSON invalido')); // Rejeita em caso de erro de parse
            }
        });
        req.on('error', reject); // Rejeita em caso de erro na requisicao
    });
}

// =========================================================
// 5. SERVICO DE ARQUIVOS ESTATICOS
// =========================================================

// Mapeamento de extensoes para tipos MIME
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.txt': 'text/plain; charset=utf-8',
};

/**
 * Serve arquivos estaticos do diretorio frontend/
 * @param {Object} req - Objeto de requisicao HTTP
 * @param {Object} res - Objeto de resposta HTTP
 * @param {string} pathname - Caminho da URL
 */
function serveStatic(req, res, pathname) {
    // Se for raiz, serve index.html
    const relativePath = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.normalize(path.join(PUBLIC_DIR, decodeURIComponent(relativePath))); // Normaliza o caminho do arquivo

    // Verificacao de seguranca: previne acesso fora do diretorio frontend/
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Acesso negado'); // Retorna 403 se tentar acessar fora do diretorio permitido
        return;
    }

    console.log(`Buscando arquivo: ${relativePath}`); // Log do arquivo sendo buscado

    // Le o arquivo de forma assincrona
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // Se o arquivo nao existir ou houver erro
            console.log(`Arquivo nao encontrado: ${relativePath}`);
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`Arquivo nao encontrado: ${relativePath}`); // Retorna 404
            return;
        }

        // Define o tipo MIME baseado na extensao
        const ext = path.extname(filePath).toLowerCase(); // Pega a extensao do arquivo
        const contentType = MIME_TYPES[ext] || 'application/octet-stream'; // Define o tipo MIME ou usa binario
        
        console.log(`Servindo arquivo: ${relativePath}`); // Log do arquivo sendo servido
        // Envia o arquivo
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data); // Envia o arquivo
    });
}

// =========================================================
// 6. FUNCOES DE FILTRO E ORDENACAO
// =========================================================

/**
 * Aplica filtros e ordenacao nos registros
 * @param {Array} registros - Array de registros
 * @param {Object} query - Parametros da query string
 * @returns {Array} Array filtrado e ordenado
 */
function aplicarFiltrosEOrdenacao(registros, query) {
    let resultado = [...registros]; // Cria uma copia do array de registros para nao modificar o original

    // ----- 6.1 FILTRO POR DESCRICAO -----
    if (query.busca) {
        const termo = query.busca.toLowerCase().trim(); // Converte para minusculo e remove espacos
        if (termo) {
            resultado = resultado.filter((r) => 
                (r.descricao || '').toLowerCase().includes(termo) // Verifica se a descricao contem o termo
            );
        }
    }

    // ----- 6.2 FILTRO POR DATA DE INICIO -----
    if (query.dataInicio) {
        const inicio = new Date(`${query.dataInicio}T00:00:00`); // Converte para data no inicio do dia
        if (!isNaN(inicio)) { // Verifica se a data eh valida
            resultado = resultado.filter((r) => {
                const dataRegistro = new Date(r.dataHora); // Converte a data do registro
                return dataRegistro >= inicio; // Mantem registros a partir da data de inicio
            });
        }
    }

    // ----- 6.3 FILTRO POR DATA DE FIM -----
    if (query.dataFim) {
        const fim = new Date(`${query.dataFim}T23:59:59.999`); // Converte para data no final do dia
        if (!isNaN(fim)) { // Verifica se a data eh valida
            resultado = resultado.filter((r) => {
                const dataRegistro = new Date(r.dataHora); // Converte a data do registro
                return dataRegistro <= fim; // Mantem registros ate a data de fim
            });
        }
    }

    // ----- 6.4 ORDENACAO -----
    // Mapeia os valores do select para campos e ordens
    const ordenacaoMap = {
        'dataHora-desc': { campo: 'dataHora', ordem: -1 }, // Mais recentes primeiro
        'dataHora-asc': { campo: 'dataHora', ordem: 1 }, // Mais antigos primeiro
        'descricao-asc': { campo: 'descricao', ordem: 1 }, // Ordem alfabetica
        'descricao-desc': { campo: 'descricao', ordem: -1 }, // Ordem alfabetica inversa
    };

    // Define a configuracao de ordenacao (padrao: mais recentes primeiro)
    const config = ordenacaoMap[query.ordenar] || ordenacaoMap['dataHora-desc'];
    const { campo, ordem } = config;

    // Aplica a ordenacao
    resultado.sort((a, b) => {
        if (campo === 'descricao') {
            // Ordenacao alfabetica com locale pt-BR
            const descA = (a.descricao || '').toLowerCase();
            const descB = (b.descricao || '').toLowerCase();
            return descA.localeCompare(descB, 'pt-BR') * ordem; // Multiplica pela ordem (1 ou -1)
        }
        
        // Ordenacao por data
        const dataA = new Date(a.dataHora);
        const dataB = new Date(b.dataHora);
        return (dataA - dataB) * ordem; // Multiplica pela ordem (1 ou -1)
    });

    return resultado; // Retorna o array filtrado e ordenado
}

// =========================================================
// 7. CRIACAO DO SERVIDOR HTTP
// =========================================================

const server = http.createServer(async (req, res) => {
    // ----- 7.1 PARSE DA URL -----
    let parsedUrl;
    try {
        parsedUrl = new URL(req.url, `http://${req.headers.host}`); // Parseia a URL da requisicao
    } catch {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('URL invalida'); // Retorna 400 se a URL for invalida
        return;
    }

    const { pathname } = parsedUrl; // Extrai o caminho da URL
    const query = Object.fromEntries(parsedUrl.searchParams); // Converte parametros de query para objeto

    // ----- 7.2 LOG DA REQUISICAO (para debug) -----
    console.log(`${req.method} ${pathname}`); // Exibe no console o metodo e caminho da requisicao

    try {
        // ----- 7.3 TRATAMENTO DE CORS (OPTIONS) -----
        if (req.method === 'OPTIONS') {
            res.writeHead(204, { // 204 No Content
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            });
            res.end();
            return;
        }

        // ----- 7.4 ROTA GET /api/registros -----
        if (pathname === '/api/registros' && req.method === 'GET') {
            const registros = readDB(); // Le os registros do banco
            const resultado = aplicarFiltrosEOrdenacao(registros, query); // Aplica filtros e ordenacao
            sendJSON(res, 200, resultado); // Retorna 200 (OK) com os registros
            return;
        }

        // ----- 7.5 ROTA POST /api/registros -----
        if (pathname === '/api/registros' && req.method === 'POST') {
            let body;
            try {
                body = await readBody(req); // Le o corpo da requisicao
            } catch {
                sendJSON(res, 400, { erro: 'JSON invalido' }); // Retorna 400 se JSON invalido
                return;
            }

            // Validacao dos dados obrigatorios
            if (!body.data || !body.hora) {
                sendJSON(res, 400, { erro: 'Data e hora sao obrigatorios' }); // Retorna 400 se faltar dados
                return;
            }

            // Constroi a data/hora no formato ISO
            const dataHora = new Date(`${body.data}T${body.hora}:00`);
            if (isNaN(dataHora)) { // Verifica se a data eh valida
                sendJSON(res, 400, { erro: 'Data ou hora invalida' }); // Retorna 400 se data invalida
                return;
            }

            const registros = readDB(); // Le os registros existentes
            const novoRegistro = { // Cria novo registro com dados padrao
                id: crypto.randomUUID(), // Gera ID unico (UUID v4)
                dataHora: dataHora.toISOString(), // Converte para string ISO
                descricao: String(body.descricao || '').trim().slice(0, 200), // Descricao com limite de 200 caracteres
            };

            registros.push(novoRegistro); // Adiciona ao array de registros
            writeDB(registros); // Salva no arquivo
            
            sendJSON(res, 201, novoRegistro); // Retorna 201 (Created) com o novo registro
            return;
        }

        // ----- 7.6 ROTA DELETE /api/registros/:id -----
        if (pathname.startsWith('/api/registros/') && req.method === 'DELETE') {
            const id = decodeURIComponent(pathname.split('/').pop()); // Extrai o ID da URL
            
            if (!id) { // Verifica se o ID foi fornecido
                sendJSON(res, 400, { erro: 'ID nao fornecido' });
                return;
            }

            const registros = readDB(); // Le os registros existentes
            const tamanhoAntes = registros.length; // Salva o tamanho atual
            const restantes = registros.filter((r) => r.id !== id); // Filtra removendo o registro com o ID

            if (restantes.length === tamanhoAntes) { // Se nao removeu nenhum, registro nao encontrado
                sendJSON(res, 404, { erro: 'Registro nao encontrado' });
                return;
            }

            writeDB(restantes); // Salva o array sem o registro removido
            sendJSON(res, 200, { ok: true, mensagem: 'Registro removido com sucesso' }); // Retorna 200 com sucesso
            return;
        }

        // ----- 7.7 ROTA DE API NAO ENCONTRADA -----
        if (pathname.startsWith('/api/')) {
            sendJSON(res, 404, { erro: 'Rota de API nao encontrada' }); // Retorna 404 para rotas API nao encontradas
            return;
        }

        // ----- 7.8 ROTAS ESTATICAS (HTML, CSS, JS) -----
        serveStatic(req, res, pathname); // Serve arquivos estaticos para rotas nao-API

    } catch (err) {
        // ----- 7.9 TRATAMENTO DE ERROS -----
        console.error('Erro inesperado:', err); // Log do erro no servidor
        sendJSON(res, 500, { erro: 'Erro interno no servidor' }); // Retorna 500 para erro interno
    }
});

// =========================================================
// 8. INICIALIZACAO DO SERVIDOR
// =========================================================

server.listen(PORT, () => {
    console.log('====================================================');
    console.log('REGISTRADOR DE TEMPOS');
    console.log('====================================================');
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log(`Banco de dados: ${DB_PATH}`);
    console.log(`Arquivos estaticos: ${PUBLIC_DIR}`);
    console.log('====================================================');
    console.log('Servidor pronto para uso.');
    console.log('====================================================');
});

// =========================================================
// 9. TRATAMENTO DE ENCERRAMENTO
// =========================================================

/**
 * Funcao para encerrar o servidor de forma graceful
 */
function gracefulShutdown() {
    console.log('\nEncerrando servidor...');
    server.close(() => {
        console.log('Servidor encerrado com sucesso');
        process.exit(0);
    });
}

// Captura sinais de encerramento
process.on('SIGTERM', gracefulShutdown); // Captura SIGTERM
process.on('SIGINT', gracefulShutdown); // Captura SIGINT (Ctrl+C)

// =========================================================
// 10. EXPORTACAO (para testes)
// =========================================================

module.exports = {
    server,
    readDB,
    writeDB,
    aplicarFiltrosEOrdenacao,
};