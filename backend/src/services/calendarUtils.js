// calendlyUtils.js (Versão simplificada sem consulta de disponibilidade via API)
import { DateTime } from 'luxon'; 
// Não é necessário o 'axios' nesta versão
// import axios from 'axios'; 

// --- Configurações de Acesso ---
// ⚠️ SUBSTITUA COM SEU LINK REAL!
const BASE_CALENDLY_URL = process.env.CALENDLY_BASE_URL || 'https://calendly.com/lucasgcbennertz/30min'; 
const TIME_ZONE = 'America/Sao_Paulo'; 

// ⚠️ Variáveis de API removidas, pois não serão usadas para buscar disponibilidade.
// const CALENDLY_API_TOKEN = process.env.CALENDLY_TOKEN; 
// const EVENT_TYPE_URI = process.env.CALENDLY_EVENT_TYPE_URI || 'SEU_EVENT_TYPE_URI_COMPLETO_AQUI'; 

// ====================================================================
// PLACEHOLDER: Função de Atualização do Pipefy (MANTIDA)
// ====================================================================
/**
 * Realiza a ATUALIZAÇÃO INICIAL no Pipefy após o envio do link.
 * A atualização FINAL (com data/hora) será feita pelo Webhook (fora deste arquivo).
 */
async function atualizarCardAgendamento(card_id, meeting_link, meeting_datetime_status) {
    console.log(`[PLACEHOLDER] Chamando atualização do Pipefy para o Card ID: ${card_id}`);
    console.log(`Status de Agendamento: ${meeting_datetime_status}`);
    
    // ⚠️ Sua lógica real para atualizar o card no Pipefy vai aqui
    
    return { status: "success", message: `Card ${card_id} atualizado. Status: ${meeting_datetime_status}` };
}


// ====================================================================
// 1. buscarDisponibilidade (SIMPLIFICADA)
// ====================================================================
/**
 * Com o Calendly, a busca de disponibilidade deve ser feita pelo usuário
 * diretamente no link. Esta função retorna um aviso.
 */
async function buscarDisponibilidade() {
    console.warn("[AVISO] A busca de disponibilidade manual foi removida/simplificada. Envie o link do Calendly para o Lead.");
    
    // Retorna um array vazio ou um mock simples para evitar erros de código
    return ["Quarta-feira às 10 horas, Quinta-feira às 14 horas, Sexta-feira às 16 horas"]; 
}


// ====================================================================
// 2. agendarReuniao (Gera Link com Rastreio)
// ====================================================================
async function agendarReuniao(card_id, lead_email, start_time_iso, duration_minutes = 60) {
    const lead_name = lead_email.split('@')[0]; 

    // Montar os parâmetros de Pré-Preenchimento (Pre-fill)
    const prefillParams = new URLSearchParams({
        'name': lead_name,
        'email': lead_email,
        
        // Parâmetro de Rastreamento (IMPORTANTE: O Card ID do Pipefy)
        'utm_content': card_id, 
        
        'utm_source': 'Pipefy', 
        'utm_medium': 'API',
        'date_and_time_query': TIME_ZONE, 
    });

    const meetingLink = `${BASE_CALENDLY_URL}?${prefillParams.toString()}`;
    
    // Atualização inicial no Pipefy (registra o link e o status)
    await atualizarCardAgendamento(card_id, meetingLink, 'Link de agendamento enviado');
    
    return {
        status: "success",
        meeting_link: meetingLink,
        datetime_formatado: 'Link gerado, aguardando agendamento no Calendly.',
        message: `Link de agendamento Calendly gerado com sucesso. Envie este link para o lead: ${meetingLink}`
    };
}

export { buscarDisponibilidade, agendarReuniao };