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
  const [attachedInfo, setAttachedInfo] = useState<{ count: number, path?: string } | null>(null);
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

    // Communication with local AI engine (Task 2.1)
    try {
      const electron = (window as any).electronAPI;
      if (electron && electron.sendMessage) {
        const result = await electron.sendMessage(inputValue);

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: result.success ? result.response : `خطأ: ${result.error}`,
          sender: 'ai',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);

        // إذا كان الرد يحتوي على كود (محاكاة بسيطة للفلترة لاحقاً)
        if (result.success && result.response.includes('<html>')) {
          if (onCodeGenerated) onCodeGenerated(result.response);
        }
      } else {
        // Falling back to simulation if API not available
        setTimeout(() => {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: "عذراً، محرك الذكاء الاصطناعي المحلي غير متصل حالياً.",
            sender: 'ai',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMsg]);
          setIsLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setIsLoading(false);
    }
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

  const handleAttach = async () => {
    const electron = (window as any).electronAPI;
    if (!electron) return;

    // إظهار خيار للمستخدم (مجلد أو ملف)
    const result = await electron.selectFolder();
    if (result.success) {
      setAttachedInfo({ count: result.fileCount });
    } else {
      const fileResult = await electron.selectFile();
      if (fileResult.success) {
        setAttachedInfo({ count: fileResult.fileCount });
      }
    }
  };

  const clearRag = async () => {
    const electron = (window as any).electronAPI;
    if (electron) {
      await electron.clearRagContext();
      setAttachedInfo(null);
    }
  };

  return (
    <div className="chatContainer" dir="rtl">

      <div className="chatHeader">
        <div className="headerInfo">
          <Bot size={18} className="aiIcon" />
          <span>المساعد المحلي (GGUF Engine)</span>
        </div>
        <div className="headerActions">
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
        {attachedInfo && (
          <div className="ragStatus">
            <span>📎 تم إرفاق سياق محلي ({attachedInfo.count} ملفات)</span>
            <button onClick={clearRag} className="ragClearBtn">إلغاء الإرفاق</button>
          </div>
        )}
        <div className="inputWrapper">
          <button className="attachBtn" title="إرفاق مجلد أو ملف للمشروع" onClick={handleAttach}>
            <Paperclip size={18} color={attachedInfo ? '#00ffcc' : 'currentColor'} />
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