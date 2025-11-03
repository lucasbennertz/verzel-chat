async function createOrUpdateCard(payload){
console.log('pipefy mock payload', payload.sessionId);
return { status:'ok' };
}


export default { createOrUpdateCard };