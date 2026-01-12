const MyMessage = ({ message }) => {
  if (message.attachments && message.attachments.length > 0) {
    return (
      <img
        src={message.attachments[0].file}
        alt="message-attachment"
        className="message-image"
        style={{ float: "right" }}
      />
    );
  }

  return (
    <div
      className="message"
      style={{
        float: "right",
        marginRight: "10px",
        color: "white",
        backgroundColor: "#3B2A50",
        borderRadius: "20px 20px 0 20px", // Rounded corners, distinct shape
        padding: "10px 15px",
        maxWidth: "60%",
        wordWrap: "break-word",
      }}
    >
      {message.text}
    </div>
  );
};

export default MyMessage;
