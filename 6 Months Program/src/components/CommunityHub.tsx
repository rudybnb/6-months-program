import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MessageSquarePlus, MessageCircle } from 'lucide-react';
import type { AppData } from '../types';
import './CommunityHub.css';

interface CommunityHubProps {
  appData: AppData;
  onBack: () => void;
}

type Subject = {
  id: string;
  title: string;
  author: string;
  timestamp: number;
};

type ChatMessage = {
  id: string;
  subjectId: string;
  author: string;
  content: string;
  timestamp: number;
};

export const CommunityHub: React.FC<CommunityHubProps> = ({ appData, onBack }) => {
  const firstName = appData.profile?.name?.split(' ')[0] || 'User';

  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', title: 'How do you handle morning resistance?', author: 'Sarah', timestamp: Date.now() - 86400000 },
    { id: '2', title: 'Tips for winding down in the evening', author: 'David', timestamp: Date.now() - 172800000 },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', subjectId: '1', author: 'Sarah', content: 'Felt a lot of resistance this morning, but showed up anyway. What do you all do when you just do not want to get out of bed?', timestamp: Date.now() - 86400000 },
    { id: '2', subjectId: '1', author: 'Michael', content: 'I put my phone across the room so I have to stand up.', timestamp: Date.now() - 82000000 },
    { id: '3', subjectId: '2', author: 'David', content: 'Does anyone have tips for winding down in the evening? I struggle to turn my mind off.', timestamp: Date.now() - 172800000 }
  ]);

  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSubjectId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeSubjectId]);

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectTitle.trim()) return;

    const newSubject: Subject = {
      id: Date.now().toString(),
      title: newSubjectTitle.trim(),
      author: firstName,
      timestamp: Date.now()
    };

    setSubjects(prev => [newSubject, ...prev]);
    setActiveSubjectId(newSubject.id);
    setNewSubjectTitle('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSubjectId) return;

    const post: ChatMessage = {
      id: Date.now().toString(),
      subjectId: activeSubjectId,
      author: firstName,
      content: newMessage.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, post]);
    setNewMessage('');
  };

  // --- List View ---
  if (!activeSubjectId) {
    return (
      <div className="community-container">
        <div className="community-header">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title-wrapper">
            <h2>Discussions</h2>
          </div>
        </div>

        <div className="community-content">
          <form onSubmit={handleCreateSubject} className="create-subject-form">
            <div className="create-subject-wrapper">
              <input
                type="text"
                placeholder="Start a new subject..."
                value={newSubjectTitle}
                onChange={(e) => setNewSubjectTitle(e.target.value)}
              />
              <button 
                type="submit" 
                className="create-btn"
                disabled={!newSubjectTitle.trim()}
              >
                <MessageSquarePlus size={20} />
              </button>
            </div>
          </form>

          <div className="subjects-list">
            {subjects.map(subject => {
              const subjectMessages = messages.filter(m => m.subjectId === subject.id);
              const replyCount = subjectMessages.length;
              const date = new Date(subject.timestamp);
              const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <div 
                  key={subject.id} 
                  className="subject-card"
                  onClick={() => setActiveSubjectId(subject.id)}
                >
                  <div className="subject-card-header">
                    <span className="subject-author">{subject.author}</span>
                    <span className="subject-date">{dateString}</span>
                  </div>
                  <h3 className="subject-title">{subject.title}</h3>
                  <div className="subject-meta">
                    <MessageCircle size={16} />
                    <span>{replyCount} {replyCount === 1 ? 'message' : 'messages'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- Chat View ---
  const activeSubject = subjects.find(s => s.id === activeSubjectId);
  const activeMessages = messages.filter(m => m.subjectId === activeSubjectId);

  return (
    <div className="chat-layout">
      <div className="chat-header">
        <button className="back-button" onClick={() => setActiveSubjectId(null)}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-title-wrapper">
          <h2 className="chat-subject-title">{activeSubject?.title}</h2>
          <span className="chat-subject-author">Started by {activeSubject?.author}</span>
        </div>
      </div>

      <div className="chat-messages">
        {activeMessages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Be the first to reply.</p>
          </div>
        ) : (
          activeMessages.map((msg, index) => {
            const date = new Date(msg.timestamp);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const showHeader = index === 0 || activeMessages[index - 1].author !== msg.author;

            return (
              <div key={msg.id} className={`chat-message ${showHeader ? 'mt-4' : 'mt-1'}`}>
                {showHeader && (
                  <div className="message-header">
                    <span className="message-author">{msg.author}</span>
                    <span className="message-time">{timeString}</span>
                  </div>
                )}
                <div className="message-content">
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-area">
        <div className="chat-input-wrapper">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            autoFocus
          />
          <button 
            type="submit" 
            className="send-btn"
            disabled={!newMessage.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};
