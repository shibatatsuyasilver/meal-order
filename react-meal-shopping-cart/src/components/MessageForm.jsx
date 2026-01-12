import { useState, useRef } from "react";
import { SendOutlined, PlusOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { sendMessage, isTyping } from "react-chat-engine";
import api from "./api";

const MessageForm = (props) => {
  const [value, setValue] = useState("");
  const { chatId, creds } = props;
  const inputRef = useRef(null);

  const handleChange = (event) => {
    setValue(event.target.value);

    isTyping(props, chatId);
  };

  const handleSubmit = async () => {
    const text = value.trim();
    var temp = {};
    temp["message"] = text;
    if (text.length > 0) {
      sendMessage(creds, chatId, { text });
      try {
        const r = await api.post("/uploadMessage/", temp);
        if (r.data && r.data["ai_message"]) {
          sendMessage(r.data["ai_message"]);
        }
      } catch (e) {
        console.log(e);
      }
    }

    setValue("");
  };

  const handleUpload = (event) => {
    sendMessage(creds, chatId, { files: event.target.files, text: "" });
  };

  return (
    <div className="message-form-container-card">
      <input
        type="file"
        multiple={true}
        accept=".pdf,.png,.jpg,.jpeg"
        style={{ display: "none" }}
        onChange={handleUpload}
        ref={inputRef}
      />
      <button
        className="message-button upload-button"
        onClick={() => inputRef.current.click()}
      >
        <PlusOutlined />
      </button>
      <Input
        className="message-input-area"
        placeholder="Type / for commands"
        value={value}
        onChange={handleChange}
        onPressEnter={handleSubmit}
        bordered={false}
      />
      <button
        className="message-button send-button"
        onClick={handleSubmit}
      >
        <SendOutlined />
      </button>
    </div>
  );
};

export default MessageForm;
