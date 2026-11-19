import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, MessageSquarePlus, Send, Sparkles, Trash2, Volume2 } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/stores/ui';
import { useSpeak } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/Button';
import { MarkdownText } from '@/learning/MarkdownText';

const MODES = [
  { id: 'tutor', label: 'General Tutor', prompt: 'Explain Present Perfect vs. Simple Past with 3 easy examples.' },
  { id: 'grammar', label: 'Grammar Coach', prompt: 'How do Type 1, Type 2, and Type 3 conditionals differ?' },
  { id: 'vocabulary', label: 'Vocabulary & Idioms', prompt: 'What does resilient mean? Give synonyms and an example.' },
  { id: 'writing', label: 'Writing Reviewer', prompt: 'Yesterday I go to school and i was very happy because we collaborate in english class.' },
  { id: 'conversation', label: 'Conversation Partner', prompt: "Hello! Let's practice a job interview warm-up." },
  { id: 'pronunciation', label: 'Pronunciation Coach', prompt: 'Give me tips for word stress and silent letters in English.' },
] as const;

interface ConvSummary {
  id: string;
  title: string;
  mode: string;
  updatedAt: string;
}
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AiTutorPage() {
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const { say } = useSpeak();
  const [mode, setMode] = useState<string>('tutor');
  const [convId, setConvId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(params.get('prompt') ?? '');
  const [sending, setSending] = useState(false);

  const { data: convList } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => api.get<{ conversations: ConvSummary[] }>('/ai/conversations'),
  });

  useEffect(() => {
    if (!convId) return;
    void api.get<{ conversation: { mode: string; messages: Message[] } }>(`/ai/conversations/${convId}`).then((res) => {
      setMode(res.conversation.mode);
      setMessages(res.conversation.messages);
    });
  }, [convId]);

  const sendMessage = async (text: string) => {
    const clean = text.trim();
    if (!clean || sending) return;
    setSending(true);
    setInput('');
    setMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, role: 'user', content: clean }]);

    try {
      const res = await api.post<{ conversationId: string; provider: string; messages: Message[] }>('/ai/chat', {
        conversationId: convId,
        mode,
        message: clean,
      });
      setConvId(res.conversationId);
      setMessages((prev) => [...prev.slice(0, -1), ...res.messages]);
      void qc.invalidateQueries({ queryKey: ['ai-conversations'] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const deleteConv = async (id: string) => {
    await api.delete(`/ai/conversations/${id}`);
    if (convId === id) {
      setConvId(undefined);
      setMessages([]);
    }
    void qc.invalidateQueries({ queryKey: ['ai-conversations'] });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Sidebar: Past Conversations */}
      <aside className="panel flex flex-col p-4 lg:col-span-3 lg:max-h-[78vh]">
        <Button
          variant="outline"
          size="sm"
          icon={<MessageSquarePlus className="h-4 w-4" />}
          onClick={() => {
            setConvId(undefined);
            setMessages([]);
          }}
        >
          New Chat
        </Button>

        <p className="eyebrow mb-2 mt-5 px-1">Recent Sessions</p>
        <div className="flex-1 space-y-1.5 overflow-y-auto">
          {convList?.conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setConvId(c.id)}
              className={`group flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${
                convId === c.id ? 'bg-cyan/15 text-cyan font-bold' : 'text-muted hover:bg-surface-2 hover:text-ink'
              }`}
            >
              <span className="truncate">{c.title}</span>
              <button
                aria-label="Delete conversation"
                onClick={(e) => {
                  e.stopPropagation();
                  void deleteConv(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {!convList?.conversations.length && <p className="px-2 text-xs text-muted">Your AI conversations will appear here.</p>}
        </div>
      </aside>

      {/* Main Chat Canvas */}
      <section className="panel flex min-h-[70vh] flex-col overflow-hidden lg:col-span-9">
        <div className="border-b border-line/70 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">FUTURE AI English Tutor</h1>
                <p className="text-xs text-muted">Grammar · Vocabulary · Writing Feedback · Speaking Roleplay · Pronunciation</p>
              </div>
            </div>
          </div>

          {/* Mode Chips */}
          <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  mode === m.id ? 'bg-brand-gradient text-white' : 'border border-line bg-surface-2 text-muted hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && (
            <div className="mx-auto max-w-xl py-8 text-center">
              <Sparkles className="mx-auto mb-3 h-10 w-10 text-cyan" />
              <h2 className="text-xl font-bold">How can I help your English today?</h2>
              <p className="mt-1 text-sm text-muted">Try a starter prompt below or paste your own paragraph for detailed feedback.</p>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id);
                      void sendMessage(m.prompt);
                    }}
                    className="rounded-2xl border border-line bg-surface-2/50 p-3.5 text-left text-xs hover:border-cyan/60"
                  >
                    <span className="block font-bold text-cyan">{m.label}</span>
                    <span className="mt-1 block text-muted">{m.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] rounded-3xl px-5 py-4 text-sm sm:max-w-[78%] ${
                  m.role === 'user' ? 'bg-brand-gradient text-white' : 'border border-line bg-surface-2/60 text-ink'
                }`}
              >
                <MarkdownText text={m.content} />
                {m.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => say(m.content.replace(/[#*`]/g, ''))}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-cyan hover:underline"
                  >
                    <Volume2 className="h-3.5 w-3.5" /> Read aloud
                  </button>
                )}
              </div>
            </div>
          ))}
          {sending && <p className="text-xs font-semibold text-cyan">AI Tutor is preparing a tailored response...</p>}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2.5 border-t border-line/70 p-4">
          <textarea
            rows={2}
            className="input flex-1 resize-none py-2.5 text-sm"
            placeholder="Ask a grammar rule, paste an essay to review, or start a conversation..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
          />
          <Button type="submit" loading={sending} icon={<Send className="h-4 w-4" />} className="self-end">
            Send
          </Button>
        </form>
      </section>
    </div>
  );
}
