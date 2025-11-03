async function createEvent({ sessionId, times = [] }){
const chosen = times[0] || new Date().toISOString();
return { status:'mock', provider:'mock', meeting_link:'https://meet.google.com/mock', meeting_datetime: chosen };
}


export default { createEvent };