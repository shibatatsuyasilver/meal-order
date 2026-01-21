import React, { useState, useRef, useEffect } from "react";
import Message from "./Message";
import { SendOutlined, PlusOutlined } from "@ant-design/icons";
import api from "./api";

const ChatPage = ({ history, setHistory, processing, setProcessing, sessionId, setSessionId }) => {
  const [value, setValue] = useState("");
  const inputFile = useRef(null);

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const handleNewChat = () => {
    setSessionId(null);
    setHistory([]);
    setValue("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = value.trim();
    var temp = {};
    temp["message"] = text;
    if (text.length > 0) {
      setProcessing(true);
      setHistory((h) => [...h, text]);
      setValue("");
      
      // Add session_id to request
      if (sessionId) {
        temp["session_id"] = sessionId;
      }

      // Add placeholder for AI message immediately so spinner shows up in Message component
      setHistory((h) => [...h, ""]);

      try {
        const baseURL = api.defaults.baseURL || "http://localhost:8000";
        const response = await fetch(`${baseURL}/uploadMessageStream/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(temp)
        });

        if (response.headers.get("X-Session-ID")) {
            setSessionId(response.headers.get("X-Session-ID"));
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiMessage = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            aiMessage += chunk;
            
            setHistory((h) => {
                const newHistory = [...h];
                // Update the last element (which is the AI message placeholder)
                newHistory[newHistory.length - 1] = aiMessage;
                return newHistory;
            });
        }
      } catch (e) {
        console.log(e);
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleUpload = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      setProcessing(true);
      const API_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000") + "/upload/";
      
      fetch(API_URL, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          // Optional: Add feedback or history update here
        })
        .catch((err) => console.error(err))
        .finally(() => {
          setProcessing(false);
          if (inputFile.current) inputFile.current.value = "";
        });
    }
  };

  return (
    <div className="chat-page-container">
        <div style={{
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'flex-end',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: 'white',
            zIndex: 5
        }}>
            <button
                type="button"
                onClick={handleNewChat}
                disabled={processing}
                style={{
                    backgroundColor: processing ? '#d9d9d9' : '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '18px',
                    padding: '8px 16px',
                    cursor: processing ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 500
                }}
            >
                <PlusOutlined /> New Chat
            </button>
        </div>
        <Message message={history} processing={processing} />
        
        <form className="message-form" onSubmit={handleSubmit}>
            <input
            type="file"
            multiple
            ref={inputFile}
            style={{ display: 'none' }}
            onChange={handleUpload}
            />
            <button
            type="button"
            className="message-button upload-button"
            onClick={() => inputFile.current.click()}
            disabled={processing}
            >
            <PlusOutlined />
            </button>

            <input
            className="message-input-area"
            placeholder="Send a message..."
            value={value}
            onChange={handleChange}
            disabled={processing}
            style={{ flex: 1, border: 'none', outline: 'none' }}
            />
            <button type="submit" className="message-button send-button" disabled={processing}>
            <SendOutlined className="send-icon" />
            </button>
        </form>
    </div>
  );
};

export default ChatPage;
