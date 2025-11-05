# Chat Verzel

## Visão Geral do Projeto

O Chat Verzel é uma aplicação de chat full-stack que consiste em um frontend Angular e um backend Node.js. Ele foi projetado para atuar como um assistente de pré-vendas (SDR), interagindo com os usuários, agendando reuniões e gerenciando leads com o Pipefy.

## Funcionalidades

- **Chat em Tempo Real:** Interface de chat para conversação entre o usuário e o assistente de IA.
- **Agendamento Inteligente:** O assistente pode agendar reuniões com base nas preferências do usuário.
- **Integração com Pipefy:** Cria e atualiza cards no Pipefy para gerenciamento de leads.
- **Conversação com IA:** Utiliza o Gemini para fornecer respostas inteligentes e contextuais.

## Tecnologias Utilizadas

### Backend

- **Node.js:** Ambiente de execução para o servidor.
- **Express:** Framework para a construção da API.
- **Prisma:** ORM para interação com o banco de dados.
- **Gemini:** API de IA do Google para a lógica de conversação.
- **Google Calendar:** Para o agendamento de reuniões.
- **Pipefy:** Para a gestão de leads.

### Frontend

- **Angular:** Framework para a construção da interface de usuário.
- **TypeScript:** Linguagem de programação para o frontend.

## Primeiros Passos

Siga as instruções abaixo para configurar e executar os ambientes de frontend e backend.

### Backend

1. **Navegue até o diretório do backend:**
   ```bash
   cd backend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   - Renomeie o arquivo `.env.example` para `.env`.
   - Preencha as variáveis de ambiente necessárias no arquivo `.env`.

4. **Execute as migrações do banco de dados:**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run start:dev
   ```

O servidor backend estará disponível em `http://localhost:3000`.

### Frontend

1. **Navegue até o diretório do frontend:**
   ```bash
   cd frontend/chat-verzel-frontend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm start
   ```

A aplicação frontend estará disponível em `http://localhost:4200`.

## Endpoints da API

- `POST /api/chat/message`: Envia uma mensagem para o assistente de chat.
  - **Corpo da Requisição:**
    ```json
    {
      "sessionId": "string",
      "message": "string"
    }
    ```
