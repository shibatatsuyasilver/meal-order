import { useState } from "react";
import Logo from "../images/load.svg";
const API_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000") + "/upload/";
const API_METHOD = "POST";
const STATUS_IDLE = false;
const STATUS_UPLOADING = true;

export default function Uploader(prop) {
  const [ processing, setProcessing ] = prop.processState;
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState(STATUS_IDLE);
  const [progress, setProgress] = useState({ started: false, pc: 0 });

  const uploadFiles = (data) => {
    console.log(prop);
    setProcessing(STATUS_UPLOADING);
    fetch(API_URL, {
      method: API_METHOD,
      body: data,
    })
      .then((res) => res.json())
      .then((data) => console.log(data))
      .catch((err) => console.error(err))
      .finally(() => {
        setProcessing(STATUS_IDLE);
      });
  };

  const packFiles = (files) => {
    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append(`files`, files[i]);
    }
    return data;
  };

  const handleUploadClick = () => {
    if (files.length) {
      const data = packFiles(files);
      uploadFiles(data);
    }
  };

  const renderFileList = () => (
    <ol>
      {[...files].map((f, i) => (
        <li key={i}>
          {f.name} - {f.type}
        </li>
      ))}
    </ol>
  );

  const getButtonStatusText = () =>
    processing === STATUS_IDLE ? "Send to server" : <img src= {Logo} />;

  return (
    <div>
      <input
        type="file"
        accept=".pdf"
        multiple
        onChange={(e) => setFiles(e.target.files)}
      />
      {renderFileList()}
      <button
        onClick={handleUploadClick}
        disabled={processing === STATUS_UPLOADING}
      >
        {getButtonStatusText()}
      </button>
    </div>
  );
}
