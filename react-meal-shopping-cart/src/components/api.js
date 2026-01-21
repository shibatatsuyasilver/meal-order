import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000" });

// Add interceptor to include token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);
  return api.post("/token", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

export const uploadMenu = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/api/menu/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteSession = async (sessionId) => {
  return api.delete(`/chat_history/${sessionId}`);
};

export const deleteSessions = async (ids = [], deleteAll = false) => {
  return api.post("/chat_history/delete", {
    ids,
    delete_all: deleteAll,
  });
};

export default api;
