import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Bot, User, Loader2, Camera, Image as ImageIcon, X, Check } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
};

export default function Solve() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Namaste ${user?.name || 'Student'}! Koi bhi question puchhein ya photo khinch kar bhejein, main solve karunga.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Image Crop State
  const [upImg, setUpImg] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<any>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          setUpImg(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = reader.result?.toString() || '';
      });
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = (image: HTMLImageElement, crop: any): string => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );
    }
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleCropComplete = () => {
    if (imgRef.current && completedCrop?.width && completedCrop?.height) {
      const croppedUrl = getCroppedImg(imgRef.current, completedCrop);
      setCroppedImageUrl(croppedUrl);
      setUpImg(null); // Close crop modal
    } else if (upImg && !completedCrop?.width) {
      // If no crop selected, use full image
      setCroppedImageUrl(upImg);
      setUpImg(null);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !croppedImageUrl) || loading) return;

    const userMsg = input.trim();
    const userImg = croppedImageUrl;
    
    setInput('');
    setCroppedImageUrl(null);
    setLoading(true);

    const newMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: newMsgId,
      role: 'user',
      text: userMsg,
      imageUrl: userImg || undefined
    }]);

    try {
      let parts: any[] = [];
      
      if (userImg) {
        // Extract base64 data and mime type
        const mimeType = userImg.split(';')[0].split(':')[1];
        const base64Data = userImg.split(',')[1];
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType || 'image/jpeg'
          }
        });
      }
      
      const promptText = `
        You are a helpful AI tutor for Indian students.
        The user might ask a question in text or provide an image of a question.
        If there is an image, read the question from it and solve it step by step.
        If any part of the image is unclear, ask the user to clarify.
        CRITICAL RULE: If the user asks "who created you", "who made you", "tumhe kisne banaya hai", or anything similar, you MUST reply exactly: "Mujhe KKG Developer ne banaya hai."
        CRITICAL RULE: If the question in the image or text is written in Hindi script (Devanagari) or asks for a Hindi explanation, you MUST provide the entire answer and explanation in Hindi (Devanagari script).
        Otherwise, explain the answer simply in a mix of Hindi (Hinglish) and English.
        User's text: ${userMsg || 'Solve the question in the image.'}
      `;
      
      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts }
      });

      const reply = response.text || 'Maaf karna, mujhe samajh nahi aaya. Fir se try karein?';

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: reply
      }]);
    } catch (error: any) {
      console.error('Solve error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `Oops! Error: ${error.message || 'Kuch gadbad ho gayi. Thodi der baad try karein.'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
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
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="User upload" className="max-w-full rounded-lg mb-2" />
              )}
              {msg.text && <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
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
              <span className="text-slate-500 dark:text-slate-400">Solve kar raha hai...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Crop Modal */}
      {upImg && (
        <div className="absolute inset-0 bg-black/90 z-50 flex flex-col">
          <div className="p-4 flex justify-between items-center bg-black text-white">
            <button onClick={() => setUpImg(null)} className="p-2">
              <X className="w-6 h-6" />
            </button>
            <span className="font-medium">Crop Question</span>
            <button onClick={handleCropComplete} className="p-2 text-indigo-400">
              <Check className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
            >
              <img 
                ref={imgRef}
                src={upImg} 
                alt="Upload" 
                className="max-w-full max-h-[70vh] object-contain"
              />
            </ReactCrop>
          </div>
          <div className="p-4 text-center text-white/70 text-sm">
            Sirf us question ko crop karein jiska answer chahiye.
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white dark:bg-slate-800 p-3 border-t border-slate-100 dark:border-slate-700 shrink-0 transition-colors duration-300">
        {croppedImageUrl && (
          <div className="mb-3 relative inline-block">
            <img src={croppedImageUrl} alt="Cropped" className="h-20 rounded-lg border border-slate-200 dark:border-slate-700" />
            <button 
              onClick={() => setCroppedImageUrl(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={cameraInputRef}
            onChange={onSelectFile}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={galleryInputRef}
            onChange={onSelectFile}
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="Camera"
          >
            <Camera className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="Gallery"
          >
            <ImageIcon className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Sawal puchhein..."
            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all min-w-0 placeholder-slate-400 dark:placeholder-slate-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={(!input.trim() && !croppedImageUrl) || loading}
            className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
