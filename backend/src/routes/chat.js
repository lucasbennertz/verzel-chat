import express from 'express';
// 1. Alteração: Importar o serviço correto
import GeminiService from '../services/gemini.js'; 
import scheduler from '../services/scheduler.js';
import pipefy from '../services/pipefy.js';


const router = express.Router();


router.post('/message', async (req, res) => {
try{
    const { sessionId, message } = req.body;
    
    // 2. Alteração: Chamar o método correto do GeminiService
    const result = await GeminiService.converse({ sessionId, message }); 


    // A lógica abaixo permanece a mesma, pois o 'result' (resposta)
    // terá a mesma estrutura (reply, interest_confirmed, etc.)
    if(result.interest_confirmed || result.wantsToSchedule){
        const times = result.preferred_times || result.preferredTimes || [];
        if(times.length > 0){
            const ev = await scheduler.createEvent({ sessionId, times });
            result.scheduled = ev;
        }
    }


    await pipefy.createOrUpdateCard({ sessionId, message, result });


    res.json(result);
}catch(err){
    console.error(err);
    res.status(500).json({ error: 'internal' });
}
});


export default router;