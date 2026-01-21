import { useEffect, useState, useRef } from "react";
import { Layout, Row } from 'antd';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Header from "./components/Header";
import Main from "./components/Main";
import Basket from "./components/Basket";
import MenuUploader from "./components/MenuUploader";
import Login from "./components/Login";
import Register from "./components/Register";
import OAuthCallback from "./components/OAuthCallback";
import Message from "./components/Message";
import Sidebar from "./components/Sidebar";
import ChatHistory from "./components/ChatHistory";
import "./App.css";
import data from "./data";
import api from "./components/api";
import ChatPage from "./components/ChatPage";
import TableManager from "./components/TableManager/TableManager";

const { Content } = Layout;

function App() {
  const [cartItems, setCartItems] = useState([]);
  const { products } = data;
  const [history, setHistory] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || "");
  const [currentView, setCurrentView] = useState("home");
  const navigate = useNavigate();

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
    setCurrentView("chat"); // Switch to chat view
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

  const mainAppContent = (
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
            </div>
          )}
          {currentView === 'chat' && (
              <ChatPage 
                history={history} 
                setHistory={setHistory} 
                processing={processing} 
                setProcessing={setProcessing} 
                sessionId={sessionId} 
                setSessionId={setSessionId} 
              />
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
          {currentView === 'tables' && userRole === 'seller' && (
             <TableManager />
          )}
       </Content>
     </Layout>
    </Layout>
  );

  return (
    <Routes>
      <Route path="/oauth-callback" element={<OAuthCallback onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/register" element={<Register onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/" element={!isLoggedIn ? <Login onLoginSuccess={handleLoginSuccess} /> : mainAppContent} />
      <Route path="*" element={!isLoggedIn ? <Login onLoginSuccess={handleLoginSuccess} /> : mainAppContent} />
    </Routes>
  );
}

export default App;
