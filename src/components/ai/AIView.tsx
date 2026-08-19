import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bot, Send, Trash2, Sparkles, Sun } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import type { AIMessage } from '../../types';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  baseURL: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
  dangerouslyAllowBrowser: true,
});

function buildSystemPrompt(notes: ReturnType<typeof useApp>['notes']): string {
  const today = new Date().toISOString().split('T')[0];
  const todayNotes = notes.filter(n => n.date === today);
  const allTasks = notes.flatMap(n => n.checklist.map(c => ({ ...c, noteTitle: n.title, noteDate: n.date })));
  const pendingTasks = allTasks.filter(t => !t.done);

  return `Tu es un assistant personnel intelligent et bienveillant. Tu aides l'utilisateur à organiser sa journée, ses notes et ses tâches.

Date du jour : ${format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}

NOTES DU JOUR (${todayNotes.length}) :
${todayNotes.map(n => `- [${n.priority.toUpperCase()}] "${n.title}"${n.time ? ` à ${n.time}` : ''}${n.content ? ` : ${n.content.slice(0, 100)}` : ''}${n.checklist.length > 0 ? ` (${n.checklist.filter(c => c.done).length}/${n.checklist.length} tâches)` : ''}`).join('\n') || 'Aucune note planifiée aujourd\'hui.'}

TOUTES LES NOTES (${notes.length} au total) :
${notes.slice(0, 20).map(n => `- "${n.title}" [${n.category}/${n.priority}]${n.date ? ` le ${n.date}` : ''}`).join('\n')}

TÂCHES EN ATTENTE (${pendingTasks.length}) :
${pendingTasks.slice(0, 15).map(t => `- "${t.text}" (note: "${t.noteTitle}"${t.noteDate ? `, le ${t.noteDate}` : ''})`).join('\n') || 'Aucune tâche en attente.'}

Réponds toujours en français. Sois concis, précis et utile. Utilise des emojis avec modération pour rendre les réponses plus lisibles.`;
}

export function AIView() {
  const { notes, aiMessages, addAIMessage, clearAIMessages } = useApp();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, loading]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setError('');

    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    };
    addAIMessage(userMsg);
    setLoading(true);

    try {
      const history = [...aiMessages, userMsg].slice(-20);
      const response = await client.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: buildSystemPrompt(notes) },
          ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const reply = response.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer une réponse.';
      addAIMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      });
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Erreur inconnue';
      setError(`Erreur IA: ${errMsg}`);
      // Fallback local response
      addAIMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: generateLocalResponse(msg, notes),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: '☀️ Résumé du jour', prompt: "Qu'est-ce que je dois faire aujourd'hui ?" },
    { label: '📋 Mes tâches urgentes', prompt: 'Quelles sont mes tâches urgentes en attente ?' },
    { label: '📊 Bilan de la semaine', prompt: 'Fais-moi un bilan de mes notes et tâches de cette semaine.' },
    { label: '🎯 Prioriser', prompt: 'Aide-moi à prioriser mes tâches les plus importantes.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 800, margin: '0 auto', width: '100%', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ padding: '28px 0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Assistant IA</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Analyse vos notes et organise votre journée</p>
          </div>
        </div>
        {aiMessages.length > 0 && (
          <button className="btn-ghost" onClick={clearAIMessages} style={{ fontSize: 12 }}>
            <Trash2 size={12} /> Effacer
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="scroll-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 20 }}>
        {aiMessages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Sparkles size={28} style={{ color: 'rgba(255,255,255,0.4)' }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Bonjour !</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28, lineHeight: 1.6 }}>
              Je connais toutes vos notes et tâches.<br />
              Demandez-moi de résumer votre journée, prioriser vos tâches ou analyser votre semaine.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, maxWidth: 480, margin: '0 auto' }}>
              {quickActions.map(qa => (
                <button
                  key={qa.label}
                  className="glass glass-hover"
                  style={{
                    padding: '14px 16px', cursor: 'pointer', border: 'none',
                    color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500,
                    textAlign: 'left', transition: 'all 250ms',
                  }}
                  onClick={() => sendMessage(qa.prompt)}
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {aiMessages.map((msg, i) => (
          <MessageBubble key={msg.id} msg={msg} index={i} />
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={14} color="rgba(255,255,255,0.6)" />
            </div>
            <div className="ai-bubble" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171',
          }}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions (when chat started) */}
      {aiMessages.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {quickActions.slice(0, 2).map(qa => (
            <button key={qa.label} className="btn-ghost" style={{ fontSize: 12 }} onClick={() => sendMessage(qa.prompt)}>
              {qa.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'flex-end',
        padding: '16px 0 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <textarea
          ref={inputRef}
          className="input-premium"
          style={{ flex: 1, minHeight: 44, maxHeight: 120, resize: 'none', paddingTop: 11 }}
          placeholder="Posez une question sur vos notes, tâches, journée..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          rows={1}
        />
        <button
          className="btn-primary"
          style={{ height: 44, width: 44, padding: 0, justifyContent: 'center', flexShrink: 0 }}
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ msg, index }: { msg: AIMessage; index: number }) {
  const isUser = msg.role === 'user';
  return (
    <div
      className="animate-fade-up"
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row',
        animationDelay: `${index * 0.02}s`,
      }}
    >
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bot size={14} color="rgba(255,255,255,0.6)" />
        </div>
      )}
      <div style={{ maxWidth: '80%' }}>
        <div
          className={isUser ? '' : 'ai-bubble'}
          style={{
            padding: '12px 16px',
            borderRadius: isUser ? '14px 14px 4px 14px' : undefined,
            background: isUser ? 'rgba(255,255,255,0.08)' : undefined,
            border: isUser ? '1px solid rgba(255,255,255,0.12)' : undefined,
            fontSize: 14,
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
          }}
        >
          {msg.content}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {format(new Date(msg.timestamp), 'HH:mm')}
        </div>
      </div>
    </div>
  );
}

function generateLocalResponse(input: string, notes: ReturnType<typeof useApp>['notes']): string {
  const today = new Date().toISOString().split('T')[0];
  const todayNotes = notes.filter(n => n.date === today);
  const pendingTasks = notes.flatMap(n => n.checklist.filter(c => !c.done).map(c => `"${c.text}" (${n.title})`));
  const urgentNotes = notes.filter(n => n.priority === 'urgent');

  const lower = input.toLowerCase();
  if (lower.includes('aujourd') || lower.includes('journée') || lower.includes('jour')) {
    if (todayNotes.length === 0) {
      return "Vous n'avez aucune note planifiée pour aujourd'hui. C'est une bonne occasion d'organiser votre semaine ! 📅";
    }
    return `📅 **Votre journée du ${format(new Date(), 'd MMMM', { locale: fr })}** :\n\n${todayNotes.map((n, i) => `${i + 1}. **${n.title}**${n.time ? ` à ${n.time}` : ''} [${n.priority}]${n.checklist.length > 0 ? `\n   ✓ ${n.checklist.filter(c => c.done).length}/${n.checklist.length} tâches` : ''}`).join('\n\n')}\n\nBonne journée ! 💪`;
  }
  if (lower.includes('urgent') || lower.includes('priorité')) {
    if (urgentNotes.length === 0) return "Aucune note urgente en ce moment. Tout est sous contrôle ! ✅";
    return `🚨 **Notes urgentes** (${urgentNotes.length}) :\n\n${urgentNotes.map(n => `• **${n.title}**${n.date ? ` — ${n.date}` : ''}`).join('\n')}`;
  }
  if (lower.includes('tâche') || lower.includes('todo') || lower.includes('faire')) {
    if (pendingTasks.length === 0) return "Toutes vos tâches sont complétées ! Excellent travail ! 🎉";
    return `📋 **Tâches en attente** (${pendingTasks.length}) :\n\n${pendingTasks.slice(0, 10).map((t, i) => `${i + 1}. ${t}`).join('\n')}${pendingTasks.length > 10 ? `\n\n...et ${pendingTasks.length - 10} autres.` : ''}`;
  }
  return `J'ai analysé vos ${notes.length} notes. Vous avez ${pendingTasks.length} tâches en attente et ${todayNotes.length} notes pour aujourd'hui.\n\nQue souhaitez-vous savoir précisément ? 🤔`;
}
