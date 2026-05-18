import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Plus, Hash } from 'lucide-react';
import type { AppData } from '../types';
import './CommunityHub.css';

interface CommunityHubProps {
  appData: AppData;
  onBack: () => void;
}

type DiscussionSection = {
  id: string;
  name: string;
};

type ChatMessage = {
  id: string;
  sectionId: string;
  author: string;
  content: string;
  timestamp: number;
};

export const CommunityHub: React.FC<CommunityHubProps> = ({ appData, onBack }) => {
  const firstName = appData.profile?.name?.split(' ')[0] || 'User';

  const [sections, setSections] = useState<DiscussionSection[]>([
    { id: '1', name: 'general' },
    { id: '2', name: 'wins-and-losses' },
    { id: '3', name: 'morning-routine' }
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sectionId: '1', author: 'Sarah', content: 'Felt a lot of resistance this morning, but showed up anyway.', timestamp: Date.now() - 3600000 },
    { id: '2', sectionId: '3', author: 'David', content: 'Does anyone have tips for winding down in the evening?', timestamp: Date.now() - 7200000 },
    { id: '3', sectionId: '1', author: 'Michael', content: 'Just finished my first week. Keep going everyone.', timestamp: Date.now() - 86400000 }
  ]);

  const [activeSectionId, setActiveSectionId] = useState<string>('1');
  const [newSectionName, setNewSectionName] = useState('');
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeSectionId]);

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    const formattedName = newSectionName.trim().toLowerCase().replace(/\s+/g, '-');
    
    // Prevent duplicates
    if (sections.find(s => s.name === formattedName)) {
      setNewSectionName('');
      setIsCreatingSection(false);
      return;
    }

    const newSection: DiscussionSection = {
      id: Date.now().toString(),
      name: formattedName
    };

    setSections(prev => [...prev, newSection]);
    setActiveSectionId(newSection.id);
    setNewSectionName('');
    setIsCreatingSection(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const post: ChatMessage = {
      id: Date.now().toString(),
      sectionId: activeSectionId,
      author: firstName,
      content: newMessage.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, post]);
    setNewMessage('');
  };

  const activeMessages = messages.filter(m => m.sectionId === activeSectionId);
  const activeSection = sections.find(s => s.id === activeSectionId);

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="sections-list">
          {sections.map(section => (
            <button
              key={section.id}
              className={`section-item ${activeSectionId === section.id ? 'active' : ''}`}
              onClick={() => setActiveSectionId(section.id)}
            >
              <Hash size={16} className="section-icon" />
              {section.name}
            </button>
          ))}
        </div>

        <div className="create-section-container">
          {isCreatingSection ? (
            <form onSubmit={handleCreateSection} className="create-section-form">
              <Hash size={16} className="section-icon" />
              <input
                type="text"
                autoFocus
                placeholder="new-section"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onBlur={() => {
                  if (!newSectionName.trim()) setIsCreatingSection(false);
                }}
              />
            </form>
          ) : (
            <button 
              className="create-section-btn"
              onClick={() => setIsCreatingSection(true)}
            >
              <Plus size={16} />
              Add Section
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        <div className="chat-header">
          <Hash size={20} className="chat-header-icon" />
          <span className="chat-header-title">{activeSection?.name}</span>
        </div>

        <div className="chat-messages">
          {activeMessages.length === 0 ? (
            <div className="empty-chat">
              <p>No messages yet. Start the conversation.</p>
            </div>
          ) : (
            activeMessages.map((msg, index) => {
              const date = new Date(msg.timestamp);
              const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              // Simple check if previous message was from the same author to group them
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
              placeholder={`Message #${activeSection?.name}`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
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
    </div>
  );
};
