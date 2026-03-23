import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.id}/chat`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        loadedMessages.push({ id: doc.id, ...doc.data() } as Message);
      });
      
      if (loadedMessages.length === 0) {
        // Add initial message if chat is empty
        const initialMsg = {
          role: 'model' as const,
          text: `Namaste ${user.name}! Main aapka English Tutor hu. Aap mujhse English me baat karne ki practice kar sakte hain. Shuru karein? "Hello" likhiye!`,
          timestamp: serverTimestamp()
        };
        addDoc(collection(db, `users/${user.id}/chat`), initialMsg).catch(err => console.error("Error adding initial message:", err));
      } else {
        setMessages(loadedMessages);
      }
    }, (error) => {
      console.error("Chat onSnapshot error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Save user message to Firestore
      await addDoc(collection(db, `users/${user?.id}/chat`), {
        role: 'user',
        text: userMsg,
        timestamp: serverTimestamp()
      });

      // Build conversation history for context
      const history = messages.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`).join('\n');
      const prompt = `
        You are a friendly, encouraging English tutor for absolute beginners in India.
        The student has very little knowledge of English.
        Your goal is to help them practice basic English sentences.
        
        Rules:
        1. Speak in a mix of simple Hindi (written in English alphabet/Hinglish) and very basic English.
        2. Keep your responses short (1-3 sentences).
        3. If the student makes a mistake, gently correct them in Hindi and tell them the right English sentence.
        4. Always encourage them ("Bahot achhe!", "Shabash!", "Koi baat nahi, try again!").
        5. Ask them simple questions in English to keep the conversation going.
        6. CRITICAL RULE: If the student asks "who created you", "who made you", "tumhe kisne banaya hai", or anything similar, you MUST reply exactly: "Mujhe KKG Developer ne banaya hai."
        
        Conversation history:
        ${history}
        Student: ${userMsg}
        Tutor:
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const reply = response.text || 'Maaf karna, mujhe samajh nahi aaya. Fir se try karein?';

      // Save model reply to Firestore
      await addDoc(collection(db, `users/${user?.id}/chat`), {
        role: 'model',
        text: reply,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Chat error:', error);
      await addDoc(collection(db, `users/${user?.id}/chat`), {
        role: 'model',
        text: 'Oops! Kuch gadbad ho gayi. Thodi der baad try karein.',
        timestamp: serverTimestamp()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-4 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-600' : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            
            <div
              className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
              }`}
            >
              <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              <span className="text-slate-500 dark:text-slate-400">Tutor type kar raha hai...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white dark:bg-slate-800 p-3 border-t border-slate-100 dark:border-slate-700 shrink-0 transition-colors duration-300">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Yahan likhein..."
            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all placeholder-slate-400 dark:placeholder-slate-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
