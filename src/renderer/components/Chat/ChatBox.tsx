import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Paperclip, Eraser, BookOpen, Zap, History, Plus, Edit2, Check, X } from 'lucide-react';
import CodeSandbox from './CodeSandbox';
import ConfirmModal from '../UI/ConfirmModal';
import styles from './ChatBox.module.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatBoxProps {
  onCodeGenerated?: (code: string) => void;
  onRunCode?: (code: string) => void;
  activeModel?: string | null;
}

const ChatBox: React.FC<ChatBoxProps> = ({ onCodeGenerated, onRunCode, activeModel }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedInfo, setAttachedInfo] = useState<{ count: number, path?: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const electron = (window as any).electronAPI;
      if (electron && electron.loadChatHistory) {
        const result = await electron.loadChatHistory();
        if (result.success && result.data && result.data.length > 0) {
          // Parse dates correctly
          const loadedMsg = result.data.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          setMessages(loadedMsg);
        }
      }
      setIsHistoryLoaded(true);
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (isHistoryLoaded) {
      const electron = (window as any).electronAPI;
      if (electron && electron.saveChatHistory) {
        electron.saveChatHistory(messages);
      }
    }
  }, [messages, isHistoryLoaded]);

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
        const result = await electron.sendMessage(inputValue, activeModel);

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: result.success ? result.response : `خطأ: ${result.error}`,
          sender: 'ai',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);

        // إذا كان الرد يحتوي على كود
        if (result.success && result.response.includes('<html>')) {
          if (onCodeGenerated) onCodeGenerated(result.response);
        }
      } else {
        // Falling back to simulation if API not available
        setTimeout(() => {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: "عذراً، محرك الذكاء الاصطناعي المحلي غير متصل حالياً.\n\nمثال لكود ويب:\n```html\n<html><body><h1 style='color:green'>Hello World</h1></body></html>\n```",
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

  const handleEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = () => {
    if (!editingText.trim() || !editingMessageId) return;

    setMessages(prev => prev.map(m => 
      m.id === editingMessageId ? { ...m, text: editingText, timestamp: new Date() } : m
    ));
    
    setEditingMessageId(null);
    setEditingText('');
    
    // Suggestion: Re-send if user wants? For now just local update.
    // Usually editing a message in LLM chat might trigger a re-generation.
    // But user just asked for "ability to edit".
  };

  const renderMessageText = (text: string) => {
    // تقطيع النص للبحث عن كود ماركداون
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
        const language = match?.[1] || '';
        const code = match?.[2] || '';
        return (
          <CodeSandbox
            key={index}
            code={code}
            language={language}
            onRun={onRunCode}
          />
        );
      }
      return (
        <div key={index} className={styles.messageText}>
          {part}
        </div>
      );
    });
  };

  const clearChat = () => {
    showConfirm('مسح المحادثة', 'هل أنت متأكد من مسح جميع المحادثات وتفريغ السجل؟', () => {
      setMessages([]);
    });
  };

  const handleExportIndividual = async (msgText: string) => {
    const electron = (window as any).electronAPI;
    if (electron && electron.exportChat) {
      const session = {
        title: `رد_مخصص_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}`,
        messages: [{ sender: 'ai', text: msgText, timestamp: new Date() }]
      };
      const result = await electron.exportChat(session);
      if (result.success) {
        window.dispatchEvent(new CustomEvent('app:toast', { 
          detail: { msg: `✅ تم تصدير الرد بنجاح إلى: ${result.filePath}`, type: 'success' } 
        }));
      }
    }
  };

  const handleManualHistoryLoad = async () => {
      const electron = (window as any).electronAPI;
      if (electron && electron.loadChatHistory) {
        const result = await electron.loadChatHistory();
        if (result.success && result.data && result.data.length > 0) {
          const loadedMsg = result.data.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          setMessages(loadedMsg);
        } else {
          window.dispatchEvent(new CustomEvent('app:toast', { 
            detail: { msg: 'ℹ️ لا توجد محادثات سابقة محفوظة.', type: 'warning' } 
          }));
        }
      }
  };

  const handleAttach = async () => {
    try {
      const electron = (window as any).electronAPI;
      if (!electron) return;

      const result = await electron.selectFolder();
      if (result.success) {
        setAttachedInfo({ count: result.fileCount || 1 });
      } else if (result.error !== 'Cancelled') {
        const fileResult = await electron.selectFile();
        if (fileResult.success) {
          setAttachedInfo({ count: fileResult.fileCount || 1 });
        }
      }
    } catch (err) {
      console.error('Attach Error:', err);
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
    <div className={styles.chatContainer} dir="rtl">

      <div className={styles.chatHeader}>
        <div className={styles.headerInfo}>
          <Bot size={18} className={styles.aiIcon} />
          <span>المساعد المحلي (GGUF Engine)</span>
          {activeModel && (
            <span className={styles.statusBadge} title="النموذج النشط حالياً">
              🟢 {activeModel}
            </span>
          )}
        </div>
        <div className={styles.headerActions}>
          <button 
            onClick={() => { 
              showConfirm('محادثة جديدة', 'بدء محادثة جديدة؟', () => setMessages([]));
            }} 
            className={styles.headerAction} 
            title="محادثة جديدة"
          >
            <Plus size={16} />
          </button>
          <button 
            onClick={handleManualHistoryLoad} 
            className={styles.headerAction} 
            title="تحميل وعرض المحادثات السابقة المكتوبة مسبقاً"
          >
            <History size={16} />
          </button>
          <button 
            onClick={clearChat} 
            className={styles.headerAction} 
            title="مسح كافة الرسائل في هذه الجلسة وتفريغ السجل"
          >
            <Eraser size={16} />
          </button>
        </div>

      </div>


      <div className={styles.messagesList} ref={scrollRef}>
        {messages.length === 0 && (
          <div className={styles.welcomeArea}>
            <div className={styles.logoContainer}>
              <div className={styles.logoRing}></div>
              <div className={styles.logoInner}>
                <Zap size={30} color="#050507" strokeWidth={3} />
              </div>
            </div>
            <h3>كيف يمكنني مساعدتك في مشروعك اليوم؟</h3>
            <p>يمكنني كتابة الأكواد، تحليل الملفات، أو مراقبة أداء النظام محلياً.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.messageRow} ${styles[msg.sender] || ''}`}>
            <div className={styles.avatar}>
              {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={styles.messageContent}>
              {String(editingMessageId) === String(msg.id) ? (
                <div className={styles.editArea}>
                  <textarea 
                    className={styles.editTextarea}
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.editActions}>
                    <button onClick={handleSaveEdit} className={styles.saveEditBtn}><Check size={14} /></button>
                    <button onClick={handleCancelEdit} className={styles.cancelEditBtn}><X size={14} /></button>
                  </div>
                </div>
              ) : (
                <>
                  {renderMessageText(msg.text)}
                  <div className={styles.messageTime}>
                    {msg.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    {msg.sender === 'user' && (
                      <button 
                        onClick={() => handleEditMessage(msg)} 
                        className={styles.msgActionBtn} 
                        title="تعديل السؤال"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                    {msg.sender === 'ai' && (
                      <button 
                        onClick={() => handleExportIndividual(msg.text)} 
                        className={styles.msgExportBtn} 
                        title="تصدير هذا الرد إلى Obsidian"
                      >
                        <BookOpen size={12} /> تصدير
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={`${styles.messageRow} ${styles.ai} ${styles.loading}`}>
            <div className={styles.avatar}><Loader2 size={16} className={styles.spin} /></div>
            <div className={styles.messageContent}>
              <div className={styles.typingDots}><span>.</span><span>.</span><span>.</span></div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.inputContainer}>
        {attachedInfo && (
          <div className={styles.ragStatus}>
            <span>📎 تم إرفاق سياق محلي ({attachedInfo.count} ملفات)</span>
            <button onClick={clearRag} className={styles.ragClearBtn}>إلغاء الإرفاق</button>
          </div>
        )}
        <div className={styles.inputWrapper}>
          <button
            className={`${styles.attachBtn} ${attachedInfo ? styles.active : ''}`}
            title="إرفاق مجلد أو ملف للمشروع"
            onClick={handleAttach}
          >
            <Paperclip size={18} />
          </button>
          <textarea
            className={styles.chatInput}
            placeholder="اسأل الذكاء الاصطناعي عن كود أو أداء النظام..."
            value={inputValue}
            rows={1}
            onChange={(e) => setInputValue(e.target.value)}
            onInput={(e: any) => {
              e.target.style.height = 'auto';
              e.target.style.height = (e.target.scrollHeight) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
                (e.target as any).style.height = 'auto';
              }
            }}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            title="إرسال الرسالة للذكاء الاصطناعي"
          >
            <Send size={18} />
          </button>
        </div>

      </div>
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ChatBox;
