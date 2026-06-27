# ⏱️ Registrador de Tempos

Sistema desenvolvido para registrar horários e armazená-los em um banco de dados JSON utilizando **Node.js** no back-end e **HTML, CSS e JavaScript** no front-end.

## 📋 Descrição

O projeto permite registrar um horário juntamente com uma descrição opcional. Todos os registros são armazenados em um arquivo `db.json` e podem ser consultados posteriormente em uma página de histórico, com opções de pesquisa, filtros por período e ordenação.

## 🚀 Funcionalidades

* Registrar data e hora.
* Adicionar uma descrição opcional.
* Armazenar registros em um arquivo JSON.
* Listar todos os registros.
* Buscar registros pela descrição.
* Filtrar registros por intervalo de datas.
* Ordenar registros por:

  * Mais recentes
  * Mais antigos
  * Ordem alfabética
  * Ordem alfabética inversa
* Excluir registros.

## 🛠️ Tecnologias utilizadas

* HTML5
* CSS3
* JavaScript
* Node.js
* JSON (como banco de dados)

## ▶️ Como executar o projeto

### 1. Clone o repositório

```bash
git clone https://github.com/AlexsandraMonteiro/Fast-Double-Click.git
```

### 2. Entre na pasta

```bash
cd Registrador-de-Tempos
```

### 3. Execute o servidor

```bash
node server.js
```

### 4. Abra o navegador

```
http://localhost:3000
```

## 💾 Banco de dados

Os registros são armazenados no arquivo:

```
data/db.json
```

Cada registro possui a seguinte estrutura:

```json
{
  "id": "UUID",
  "dataHora": "2025-08-08T15:30:00.000Z",
  "descricao": "Exemplo de registro"
}
```

## 📡 API

### Listar registros

```
GET /api/registros
```

### Criar registro

```
POST /api/registros
```

Exemplo de corpo da requisição:

```json
{
  "descricao": "Reunião com cliente"
}
```

### Excluir registro

```
DELETE /api/registros/:id
```

## 📸 Telas

Adicione aqui imagens da aplicação.

Exemplo:

```
images/
    inicio.png
    historico.png
```

Depois utilize:

```md
![Tela Inicial](images/inicio.png)

![Histórico](images/historico.png)
```

## Autora

Desenvolvido por **Alexsandra Monteiro Ribeiro**.
