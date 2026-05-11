import React, { useState, useEffect, useRef } from 'react';
import './TerminalLogin.css';

interface TerminalLoginProps {
  onUnlock: () => void;
}

interface TerminalLine {
  text: string;
  type: 'info' | 'command' | 'error' | 'success';
}

export const TerminalLogin: React.FC<TerminalLoginProps> = ({ onUnlock }) => {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isBooting, setIsBooting] = useState(true);
  const [currentBootIndex, setCurrentBootIndex] = useState(0);
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const bootSequence = [
    { text: '> INITIALIZING ELITE PERFORMANCE LAB SYSTEM...', type: 'info' },
    { text: '> LOADING CORE MODULES...', type: 'info' },
    { text: '> KERNEL VERSION 6.0.24-ELITE [READY]', type: 'success' },
    { text: '> DEPLOYING ACCOUNTABILITY PROTOCOLS...', type: 'info' },
    { text: '> IDENTITY TRACKING: ACTIVE', type: 'success' },
    { text: '> DISCIPLINE ENGINE: OPTIMIZED', type: 'success' },
    { text: '> ESTABLISHING SECURE CONNECTION...', type: 'info' },
    { text: '> SYSTEM READY.', type: 'info' },
    { text: '----------------------------------------', type: 'info' },
    { text: 'WARNING: UNAUTHORIZED ACCESS DETECTED.', type: 'error' },
    { text: 'PLEASE PROVIDE ACCESS CODE TO CONTINUE.', type: 'command' },
  ];

  useEffect(() => {
    if (isBooting && currentBootIndex < bootSequence.length) {
      const timer = setTimeout(() => {
        setLines(prev => [...prev, bootSequence[currentBootIndex] as TerminalLine]);
        setCurrentBootIndex(prev => prev + 1);
      }, Math.random() * 400 + 200);
      return () => clearTimeout(timer);
    } else if (currentBootIndex === bootSequence.length) {
      setIsBooting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
      
      // Show hint after 15 seconds of inactivity
      const hintTimer = setTimeout(() => {
        if (!isAccessGranted) setShowHint(true);
      }, 15000);
      return () => clearTimeout(hintTimer);
    }
  }, [isBooting, currentBootIndex, isAccessGranted]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [lines]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isBooting && !isAccessGranted) {
      const command = inputValue.trim().toLowerCase();
      setLines(prev => [...prev, { text: `user@elite:~$ ${inputValue}`, type: 'command' }]);
      setInputValue('');

      if (command === 'help' || command === '?') {
        setLines(prev => [...prev, 
          { text: 'AVAILABLE COMMANDS:', type: 'info' },
          { text: '  access - Request system entry', type: 'info' },
          { text: '  clear  - Clear terminal history', type: 'info' },
          { text: '  status - Check system health', type: 'info' }
        ]);
      } else if (command === 'clear') {
        setLines([]);
      } else if (command === 'status') {
        setLines(prev => [...prev, { text: 'SYSTEM HEALTH: 100% | DISCIPLINE LEVEL: CRITICAL', type: 'success' }]);
      } else if (command === 'access' || command === 'unlock' || command === '0000') {
        setLines(prev => [...prev, { text: 'VERIFYING CREDENTIALS...', type: 'info' }]);
        
        setTimeout(() => {
          setLines(prev => [...prev, { text: 'ACCESS GRANTED. WELCOME BACK, OPERATOR.', type: 'success' }]);
          setIsAccessGranted(true);
          setTimeout(() => {
            onUnlock();
          }, 1500);
        }, 1000);
      } else {
        setLines(prev => [...prev, { text: 'ERROR: INVALID ACCESS CODE. ATTEMPT LOGGED.', type: 'error' }]);
      }
    }
  };

  return (
    <div className="terminal-container flicker" onClick={() => inputRef.current?.focus()}>
      <div className="scanline"></div>
      <div className="terminal-content" ref={contentRef}>
        {lines.map((line, index) => (
          <p key={index} className={`terminal-line ${line.type}`}>
            {line.text}
          </p>
        ))}
        {!isBooting && !isAccessGranted && (
          <div className="terminal-input-wrapper">
            <span className="terminal-prompt">user@elite:~$</span>
            <input
              ref={inputRef}
              type="text"
              className="terminal-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <span className="terminal-cursor"></span>
          </div>
        )}
        {isAccessGranted && (
          <div className="terminal-line success fade-in">
            INITIALIZING DASHBOARD...
          </div>
        )}
        {showHint && !isAccessGranted && (
          <div className="terminal-line info fade-in" style={{ opacity: 0.7, fontSize: '0.9rem' }}>
            HINT: Type 'help' to see available commands or 'access' to enter.
          </div>
        )}
      </div>
    </div>
  );
};
