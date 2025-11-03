import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import chatRouter from './routes/chat.js';


dotenv.config();
const app = express();
const prisma = new PrismaClient();


app.use(cors());
app.use(express.json());


app.get('/', (req, res) => res.send('🚀 API Chat Verzel rodando com sucesso!'));


// health
app.get('/health', (req,res) => res.json({ ok:true }));


app.use('/api/chat', chatRouter);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor rodando em http://localhost:${PORT}`));