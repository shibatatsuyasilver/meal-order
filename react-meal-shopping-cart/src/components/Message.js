export default function Message(props) {
  const { message } = props;
  const summessage = [];
  for (let i = 0; i < message.length; i += 2) {
    summessage.push({ u: message[i], ai: message[i + 1] });
  }
  return (
    <div className="block col-2">
      <h2>Chat</h2>
      <br />
      {message.length === 0 && <div>NULL</div>}
      {message.length !== 0 && (
        <>
          <hr />
          {summessage.map((value, i) => (
            <div key = {i}>
              <div className="text-right">User:{value.u}</div>
              <br />
              <div className="text-left">AI:{value.ai}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
