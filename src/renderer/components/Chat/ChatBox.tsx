import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Paperclip, Eraser, BookOpen } from 'lucide-react';
import './ChatBox.module.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatBox: React.FC<{ onCodeGenerated?: (code: string) => void }> = ({ onCodeGenerated }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // Simulation of AI response (will be linked to ModelManager later)
    setTimeout(() => {
      const generatedCode = `<!DOCTYPE html><html><body style="background:#09090b;color:#00ffcc;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;"><div><h1>تحديث جديد</h1><p>تم توليد هذا الكود بناءً على طلبك: ${userMsg.text}</p></div></body></html>`;

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "لقد قمت بتوليد الكود المطلوب بناءً على سياق مشروعك. يمكنك الآن معاينته في تبويب المستعرض أو المحاكي.",
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);

      // Send code to parent component
      if (onCodeGenerated) onCodeGenerated(generatedCode);
    }, 2000);
  };

  const clearChat = () => setMessages([]);

  const handleExport = async () => {
    if (messages.length === 0) return;

    const electron = (window as any).electronAPI;
    if (electron && electron.exportChat) {
      const session = {
        title: `جلسة_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}`,
        messages: messages
      };
      const result = await electron.exportChat(session);
      if (result.success) {
        alert(`تم تصدير المحادثة بنجاح إلى: ${result.filePath}`);
      }
    }
  };

  return (
    <div className="chatContainer" dir="rtl">

      <div className="chatHeader">
        <div className="headerInfo">
          <Bot size={18} className="aiIcon" />
          <span>المساعد المحلي (GGUF Engine)</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExport} className="headerAction" title="تصدير إلى Obsidian" disabled={messages.length === 0}>
            <BookOpen size={16} />
          </button>
          <button onClick={clearChat} className="headerAction" title="مسح المحادثة">
            <Eraser size={16} />
          </button>
        </div>
      </div>

      <div className="messagesList" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="welcomeArea">
            <div className="welcomeLogo">AI</div>
            <h3>كيف يمكنني مساعدتك في مشروعك اليوم؟</h3>
            <p>يمكنني كتابة الأكواد، تحليل الملفات، أو مراقبة أداء النظام محلياً.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`messageRow ${msg.sender}`}>
            <div className="avatar">
              {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className="messageContent">
              <div className="messageText">{msg.text}</div>
              <div className="messageTime">
                {msg.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="messageRow ai loading">
            <div className="avatar"><Loader2 size={16} className="spin" /></div>
            <div className="messageContent">
              <div className="typingDots"><span>.</span><span>.</span><span>.</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="inputContainer">
        <div className="inputWrapper">
          <button className="attachBtn" title="إرفاق مسار مشروع">
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            className="chatInput"
            placeholder="اسأل الذكاء الاصطناعي عن كود أو أداء النظام..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            className="sendBtn"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;