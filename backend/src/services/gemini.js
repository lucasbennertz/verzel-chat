import { GoogleGenAI, Type } from "@google/genai";
// Importações das ferramentas externas
import { buscarDisponibilidade, agendarReuniao } from './calendarUtils.js'; 
import { registrarLead } from './registrarLead.js';
import { response } from "express";

// Configurações de Retry
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 500; 

const ai = new GoogleGenAI({});
const contexts = {}; 

// ====================================================================
// DEFINIÇÃO UNIFICADA DAS TOOLS PARA O GEMINI (MANTIDA)
// ====================================================================
const geminiTools = [
  {
    functionDeclarations: [ 
      // 1. capture_sdr_data
      {
        name: "capture_sdr_data",
        description: "Captura e estrutura todos os dados de qualificação SDR...",
        parameters: { /* ... */ },
      },
      // 2. buscarDisponibilidade
      {
        name: "buscarDisponibilidade",
        description: "Busca os próximos 5 horários disponíveis para agendamento no Google Calendar.",
        parameters: { type: "object", properties: {}, required: [] },
        response: {
                type: "object",
                properties: {
                horariosDisponiveis: {
                    type: "array",
                    items: { type: "string", description: "Horário disponível em ISO 8601" }
                }
            }
        },
      },
      // 3. agendarReuniao
      {
        name: "agendarReuniao",
        description: "Cria o evento no Google Calendar e envia o convite...",
        parameters: {
            type: "object",
            properties: {
                card_id: { type: "string", description: "ID do Card no Pipefy" },
                lead_email: { type: "string", description: "Email do lead para o convite" },
                start_time_iso: { type: "string", description: "Horário de início em ISO 8601" },
                duration_minutes: { type: "integer", description: "Duração da reunião em minutos" }
            },
            required: ["card_id", "lead_email", "start_time_iso"]
        },
        response: {
                type: "object",
                properties: {
                status: { type: "string", description: "Status da operação (success ou error)" },
                message: { type: "string", description: "Mensagem detalhada sobre o resultado" }
            }
        },
      },
      // 4. registrarLead
      {
        name: "registrarLead",
        description: "Cria um novo Card no Pipefy com os dados de qualificação...",
        parameters: { /* ... */ },
      }
    ],
  },
];


async function converse({ sessionId, message }) {
  contexts[sessionId] = contexts[sessionId] || [];
  contexts[sessionId].push({ role: 'user', parts: [{ text: message }] });
  
  let lastError;
  let parsed = {}; 
  
  const systemInstruction = `Você é um Agente SDR especializado em coletar dados dos clientes em potencial (prospects) para qualificação Sua função é conduzir uma entrevista focada sequencial e eficiente para construir um perfil de lead completo Mantenha o diálogo estritamente focado na extração de informações evitando conversas que não contribuam para o perfil do lead Seu tom deve ser profissional direto e cortês Use o mínimo de palavras necessário para fazer sua pergunta e obter a resposta Priorize a coleta das seguintes informações Nome Completo da Pessoa, Email, Nome da Empresa, Desafio de Negócio (Pain Point) Ao final da interação ou quando solicitado você deve consolidar as informações coletadas e apresentar o perfil completo do lead em um bloco de texto Nunca invente ou crie informações Se um dado não for fornecido marque-o como Pendente,ao final quando coletar os dados, deve apresentar datas e horários disponíveis para agendamento de uma reunião de follow-up Utilize as funções disponíveis para buscar disponibilidade e agendar reuniões conforme necessário`;

  // **********************************************
  // LÓGICA DE FUNCTION CALLING (Loop Principal)
  // **********************************************
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const history = contexts[sessionId];
    let reply = ''; 

    try {
        const resp = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: history,
            config: {
                tools: geminiTools,
                tool_config: { function_calling_config: { mode: "auto" } },
                temperature: 0.1,
                systemInstruction: systemInstruction,
            },
        });

        const candidates = resp.candidates;
        
        if (!candidates || candidates.length === 0 || !candidates[0].content) {
            throw new Error('Resposta da API Gemini inválida ou vazia.');
        }

        let functionCalls = [];
        let modelText = '';
        
        // 1. Processar todas as Partes
        for (const part of candidates[0].content?.parts || []) {
            if (part.text && part.text.trim().length > 0) {
                modelText = part.text;
            }
            if (part.functionCall) {
                functionCalls.push(part.functionCall);
            }
        }
        
        // 2. Lidar com chamadas de função (Multi-Turn)
        if (functionCalls.length > 0) {
            const functionResponseParts = [];
            let isSdrDataCall = false;
            
            // --- 2.1. CONSTRUIR E ADICIONAR ROLE: MODEL (Chamada) ---
            let modelParts = []; 
            if (modelText.trim().length > 0) {
                modelParts.push({ text: modelText });
            }
            for (const call of functionCalls) {
                modelParts.push({ functionCall: call });
            }
            contexts[sessionId].push({ role: 'model', parts: modelParts });


            // --- 2.2. Executar e Coletar Respostas (ROLE: FUNCTION) ---
            for (const call of functionCalls) {
                console.log(`Gemini solicitou a função: ${call.name} com argumentos:`, call.args);
                let resultado = {};

                switch (call.name) {
                    case 'capture_sdr_data':
                        parsed = call.args; 
                        resultado = { status: "success", message: "Dados SDR estruturados." };
                        isSdrDataCall = true;
                        break;
                    case 'registrarLead':
                        const argsLead = call.args;
                        resultado = await registrarLead(argsLead.nome, argsLead.email, argsLead.empresa, argsLead.necessidade, argsLead.interesse_confirmado);
                        break;
                    case 'buscarDisponibilidade':
                        const horarios = await buscarDisponibilidade();
                        resultado = {
                            horariosDisponiveis: horarios
                        }
                        break;
                    case 'agendarReuniao':
                        const argsAgenda = call.args;
                        resultado = await agendarReuniao(argsAgenda.card_id, argsAgenda.lead_email, argsAgenda.start_time_iso, argsAgenda.duration_minutes);
                        break;
                    default:
                        resultado = { status: "error", message: `Função desconhecida: ${call.name}` };
                }

                // Armazena a resposta da função (estrutura CRÍTICA para o Gemini)
                functionResponseParts.push({
                    functionResponse: {
                        name: call.name,
                        response: resultado
                    }
                });
            }

            // --- 2.3. ADICIONAR ROLE: FUNCTION (Resposta) ---
            contexts[sessionId].push({ role: 'function', parts: functionResponseParts });

            // 3. Se houver chamada de função (que não seja SDR data), continua o loop
            if (functionCalls.length > 0 && !isSdrDataCall) {
                continue; 
            }
        }
        
        // 4. Retorno Final
        if (modelText.trim().length > 0) {
            reply = modelText;
        } else if (functionCalls.length > 0) {
            reply = 'Processando sua solicitação... Qual o próximo passo que você gostaria de dar?'; 
        }

        return { reply, ...parsed };

    } catch (e) {
        lastError = e;
        
        // ... (lógica de retry 503) ...
        if (e.status === 503 && attempt < MAX_RETRIES) {
            const delay = INITIAL_DELAY_MS * (2 ** (attempt - 1)); 
            console.warn(`Tentativa ${attempt} falhou (503 - Sobrecarregado). Tentando novamente em ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            contexts[sessionId].pop(); 
        } else {
            throw e; 
        }
    }
  }
  
  throw lastError; 
}

export default { converse };