import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';

export default function Message({ message, processing }) {
  const endOfMessagesRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [message, processing]);

  return (
    <div className="message-list">
      {message.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
          Start a conversation...
        </div>
      )}
      
      {message.map((msg, index) => {
        // Even index = User, Odd index = AI
        const isUser = index % 2 === 0;
        const bubbleClass = isUser ? 'message-bubble user' : 'message-bubble ai';

        return (
          <div key={index} className={bubbleClass}>
            {msg}
            {/* Show spinner if this is the last AI message slot and it's empty/processing */}
            {!isUser && processing && index === message.length - 1 && !msg && (
               <Spin size="small" style={{ marginLeft: 5 }} />
            )}
          </div>
        );
      })}
      
      <div ref={endOfMessagesRef} />
    </div>
  );
}
