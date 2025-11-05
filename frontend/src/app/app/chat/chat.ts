import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Message { from: 'sent'|'received'; text: string; time?: string }

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css'],
})
export class ChatComponent {
  messagesSignal = signal<Message[]>([]);
  input = '';
  sessionId = '';
  API_BASE = 'https://back-verzel-git-main-lucasbennertzs-projects.vercel.app/api'; // endpoint do backend

  constructor(private http: HttpClient) {
    const s = localStorage.getItem('chat_session_id');
    this.sessionId = s || Math.random().toString(36).slice(2);
    localStorage.setItem('chat_session_id', this.sessionId);

    const history = localStorage.getItem(`chat_history_${this.sessionId}`);
    const arr = history ? JSON.parse(history) as Message[] : [];
    if (arr.length === 0) {
      this.pushAgent('Olá! Eu sou o assistente SDR. Como posso ajudar?');
    } else {
      this.messagesSignal.set(arr);
    }
  }

  private persist() {
    localStorage.setItem(`chat_history_${this.sessionId}`, JSON.stringify(this.messagesSignal()));
  }

  private pushAgent(text: string) {
    const m: Message = { from: 'received', text, time: new Date().toISOString() };
    this.messagesSignal.update(v => [...v, m]);
    this.persist();
    setTimeout(() => this.scrollToBottom(), 50);
  }

  private pushUser(text: string) {
    const m: Message = { from: 'sent', text, time: new Date().toISOString() };
    this.messagesSignal.update(v => [...v, m]);
    this.persist();
    setTimeout(() => this.scrollToBottom(), 50);
  }

  async send() {
    const t = this.input.trim();
    if (!t) return;
    this.pushUser(t);
    this.input = '';

    try {
      const res: any = await this.http.post(`${this.API_BASE}/chat/message`, { sessionId: this.sessionId, message: t }).toPromise();
      const agentText = res.reply || JSON.stringify(res);
      let textToShow = agentText;
      if (res.scheduled) {
        textToShow += `\nReunião agendada: ${res.scheduled.meeting_link || res.scheduled.meeting_datetime}`;
      }
      this.pushAgent(textToShow);
    } catch (err) {
      console.error(err);
      this.pushAgent('Erro ao contatar o servidor. Tente novamente.');
    }
  }

  onKey(event: KeyboardEvent) {
    if (event.key === 'Enter') this.send();
    if (event.key === 'Escape') this.input = '';
  }

  private scrollToBottom() {
    // implementação simples; ok para MVP
  }
}
