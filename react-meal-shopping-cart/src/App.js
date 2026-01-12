import { useEffect, useState, useRef } from "react";
import { Layout, Row } from 'antd';
import Header from "./components/Header";
import Main from "./components/Main";
import Basket from "./components/Basket";
import MenuUploader from "./components/MenuUploader";
import Login from "./components/Login";
import Message from "./components/Message";
import Blank from "./components/Blank";
import Sidebar from "./components/Sidebar";
import ChatHistory from "./components/ChatHistory";
import "./App.css";
import data from "./data";
import api from "./components/api";
import { SendOutlined, PlusOutlined } from "@ant-design/icons";

const { Content } = Layout;

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [value, setValue] = useState("");
  const { products } = data;
  const [history, setHistory] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || "");
  const [currentView, setCurrentView] = useState("home");
  const inputFile = useRef(null);

  const handleChange = (event) => {
    setValue(event.target.value);
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

      await api
        .post("/uploadMessage/", temp)
        .then((r) => {
          setHistory((h) => [...h, r.data["ai_message"]]);
          if (r.data["session_id"]) {
            setSessionId(r.data["session_id"]);
          }
          setProcessing(false);
        })
        .catch((e) => {
          console.log(e);
          setProcessing(false);
        });
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

  const onAdd = (product) => {
    const exist = cartItems.find((x) => x.id === product.id);
    if (exist) {
      const newCartItems = cartItems.map((x) =>
        x.id === product.id ? { ...exist, qty: exist.qty + 1 } : x,
      );
      setCartItems(newCartItems);
      localStorage.setItem("cartItems", JSON.stringify(newCartItems));
    } else {
      const newCartItems = [...cartItems, { ...product, qty: 1 }];
      setCartItems(newCartItems);
      localStorage.setItem("cartItems", JSON.stringify(newCartItems));
    }
  };
  const onRemove = (product) => {
    const exist = cartItems.find((x) => x.id === product.id);
    if (exist.qty === 1) {
      const newCartItems = cartItems.filter((x) => x.id !== product.id);
      setCartItems(newCartItems);
      localStorage.setItem("cartItems", JSON.stringify(newCartItems));
    } else {
      const newCartItems = cartItems.map((x) =>
        x.id === product.id ? { ...exist, qty: exist.qty - 1 } : x,
      );
      setCartItems(newCartItems);
      localStorage.setItem("cartItems", JSON.stringify(newCartItems));
    }
  };

  useEffect(() => {
    setCartItems(
      localStorage.getItem("cartItems")
        ? JSON.parse(localStorage.getItem("cartItems"))
        : [],
    );
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setUserRole(localStorage.getItem("role") || "user");
    setCurrentView("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    setUserRole("");
    setCurrentView("home");
  };

  const handleSelectSession = async (id) => {
    setProcessing(true);
    setSessionId(id);
    setCurrentView("home");
    setHistory([]); // Clear current history while loading

    try {
      const response = await api.get(`/chat/sessions/${id}/messages`);
      const messages = response.data;
      // Convert backend message objects to the flat string array expected by Message.js
      // Backend returns: [{ is_user: true, content: "..." }, { is_user: false, content: "..." }]
      // Message.js expects: ["User Msg", "AI Msg", "User Msg", "AI Msg"]
      const flatHistory = [];
      messages.forEach(msg => {
          flatHistory.push(msg.content);
      });
      setHistory(flatHistory);
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setProcessing(false);
    }
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar 
        role={userRole} 
        onSelect={setCurrentView} 
        onLogout={handleLogout}
        selectedKey={currentView}
      />
      <Layout style={{ marginLeft: 200 }}>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          {currentView === 'home' && (
            <div className="site-layout-background" style={{ padding: 24 }}>
              <Header countCartItems={cartItems.length} />
              <Row gutter={16}>
                <Main
                  cartItems={cartItems}
                  onAdd={onAdd}
                  onRemove={onRemove}
                  products={products}
                />
                <Basket
                  cartItems={cartItems}
                  onAdd={onAdd}
                  onRemove={onRemove}
                  products={products}
                />
              </Row>
              <div className="row">
                <Message message={history} />
                <Blank />
              </div>
              <div>
                <form className="message-form" onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    className="message-input"
                    placeholder="Send a message..."
                    value={value}
                    onChange={handleChange}
                    disabled={processing}
                    style={{ flex: 1, marginBottom: 0 }} // Override any margin bottom
                  />
                  <button type="submit" className="message-button send-button" disabled={processing}>
                    <SendOutlined className="send-icon" />
                  </button>
                </form>
              </div>
            </div>
          )}
          {currentView === 'upload' && userRole === 'seller' && (
             <div className="site-layout-background" style={{ padding: 24, background: '#fff' }}>
                <MenuUploader />
             </div>
          )}
          {currentView === 'history' && (
            <div className="site-layout-background" style={{ padding: 24, background: '#fff' }}>
               <ChatHistory onSelectSession={handleSelectSession} />
            </div>
          )}
       </Content>
     </Layout>
    </Layout>
  );
}

export default App;
