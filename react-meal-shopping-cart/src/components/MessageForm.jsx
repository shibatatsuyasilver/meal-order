import { useState } from "react";
import { SendOutlined, FileOutlined } from "@ant-design/icons";
import { sendMessage, isTyping } from "react-chat-engine";
import api from "./api";

const MessageForm = (props) => {
  const [value, setValue] = useState("");
  const { chatId, creds } = props;

  const handleChange = (event) => {
    setValue(event.target.value);

    isTyping(props, chatId);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const text = value.trim();
    var temp = {};
    temp["message"] = text;
    if (text.length > 0) {
      sendMessage(creds, chatId, { text });
      await api
        .post("/uploadMessage/", temp)
        .then((r) => {
          sendMessage(r.data["ai_message"]);
        })
        .catch((e) => console.log(e));
    }

    setValue("");
  };

  const handleUpload = (event) => {
    sendMessage(creds, chatId, { files: event.target.files, text: "" });
  };

  return (
    <form className="message-form" onSubmit={handleSubmit}>
      <input
        className="message-input"
        placeholder="Send a message..."
        value={value}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
      <label htmlFor="upload-button">
        <span className="image-button">
          <FileOutlined className="picture-icon" />
        </span>
        <button type="submit" className="send-button">
          <SendOutlined className="send-icon" />
        </button>
      </label>
      <input
        type="file"
        multiple={true}
        accept=".pdf"
        id="upload-button"
        style={{ display: "none" }}
        onChange={handleUpload.bind(this)}
      />
    </form>
  );
};

export default MessageForm;
