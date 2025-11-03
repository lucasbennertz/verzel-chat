// registrarLead.js
import axios from 'axios';

// --- Configurações (Usar variáveis de ambiente é a melhor prática) ---
const PIPEFY_API_URL = "https://api.pipefy.com/graphql";
const PIPEFY_API_TOKEN = process.env.PIPEFY_API_TOKEN; // Chave obtida
const PIPE_ID = process.env.PIPE_ID;               // ID do funil de Pré-vendas

async function registrarLead(nome, email, empresa, necessidade, interesse_confirmado) {
    if (!PIPEFY_API_TOKEN || !PIPE_ID) {
        console.error("Erro: Variáveis de ambiente PIPEFY_API_TOKEN ou PIPE_ID não configuradas.");
        return { status: "error", message: "Configuração do servidor Pipefy ausente." };
    }

    // 1. Mapeamento dos campos do formulário inicial do Pipefy
    const fieldsAttributes = [
        { field_id: "nome", field_value: nome },
        { field_id: "e_mail", field_value: email }, // Use o Field ID exato do seu Pipefy!
        { field_id: "empresa", field_value: empresa },
        { field_id: "necessidade", field_value: necessidade },
        // Conversão para string 'true' ou 'false'
        { field_id: "interesse_confirmado", field_value: interesse_confirmado ? "true" : "false" }, 
    ];

    // Filtra campos com valor nulo, se necessário
    const filteredAttributes = fieldsAttributes.filter(attr => attr.field_value !== undefined && attr.field_value !== null);

    // 2. Query GraphQL para criar o Card
    const query = `
    mutation CreateCard($pipeId: ID!, $fields: [FieldValueInput!]) {
      createCard(input: {pipe_id: $pipeId, fields_attributes: $fields}) {
        clientMutationId
        card {
          id
          title
        }
      }
    }
    `;
    
    const variables = {
        pipeId: PIPE_ID,
        fields: filteredAttributes
    };

    const headers = {
        "Authorization": `Bearer ${PIPEFY_API_TOKEN}`,
        "Content-Type": "application/json"
    };

    try {
        const response = await axios.post(PIPEFY_API_URL, { query, variables }, { headers });
        const data = response.data;

        if (data.errors) {
            console.error("Erro do Pipefy:", data.errors);
            return { status: "error", message: data.errors[0].message || "Erro ao criar card no Pipefy." };
        }
            
        const card = data.data.createCard.card;
        
        return {
            status: "success",
            card_id: card.id,
            message: `Card '${card.title}' criado/atualizado com sucesso no Pipefy (ID: ${card.id}).`
        };

    } catch (error) {
        console.error("Erro na requisição Axios/Pipefy:", error.message);
        return { status: "error", message: `Erro de conexão com o Pipefy: ${error.message}` };
    }
}
export { registrarLead }; // Exporte se estiver usando módulos