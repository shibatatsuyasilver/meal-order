import { useEffect, useState } from "react";
import Header from "./components/Header";
import Main from "./components/Main";
import Basket from "./components/Basket";
import Uploader from "./components/Uploader";
import Message from "./components/Message";
import Blank from "./components/Blank";
import "./App.css";
import data from "./data";
import api from "./components/api";
import { SendOutlined, FileOutlined } from "@ant-design/icons";
function App() {
  const [cartItems, setCartItems] = useState([]);
  const [value, setValue] = useState("");
  const { products } = data;
  const [history, setHistory] = useState([]);
  const [processing, setProcessing] = useState(false);
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
      await api
        .post("/uploadMessage/", temp)
        .then((r) => {
          setHistory((h) => [...h, r.data["ai_message"]]);
          setProcessing(false);
        })
        .catch((e) => {
          console.log(e);
          setProcessing(false);
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
  return (
    <div>
      <Header countCartItems={cartItems.length} />
      <div className="row">
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
      </div>
      <div className="row">
        <Message message={history} />
        <Blank />
      </div>
      <div>
        <form className="message-form" onSubmit={handleSubmit}>
          <input
            className="message-input"
            placeholder="Send a message..."
            value={value}
            onChange={handleChange}
            onSubmit={handleSubmit}
            disabled={processing}
          />
          <button type="submit" className="send-button" disabled={processing}>
            <SendOutlined className="send-icon" />
          </button>
          <Uploader processState = {[processing, setProcessing]} />
        </form>
      </div>
    </div>
  );
}

export default App;
