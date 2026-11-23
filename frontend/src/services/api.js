import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

let refreshPromise = null;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("taskpilot_access");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    const rotasPublicas = [
      "/api/auth/login/",
      "/api/auth/register/",
      "/api/auth/refresh/",
    ];

    const rotaPublica = rotasPublicas.some((rota) =>
      originalRequest?.url?.includes(rota)
    );

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      rotaPublica
    ) {
      return Promise.reject(error);
    }

    const refresh = localStorage.getItem("taskpilot_refresh");

    if (!refresh) {
      localStorage.removeItem("taskpilot_access");
      localStorage.removeItem("taskpilot_refresh");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${api.defaults.baseURL}/api/auth/refresh/`,
            { refresh }
          )
          .then((response) => {
            localStorage.setItem(
              "taskpilot_access",
              response.data.access
            );

            return response.data.access;
          })
          .catch((refreshError) => {
            localStorage.removeItem("taskpilot_access");
            localStorage.removeItem("taskpilot_refresh");
            window.location.href = "/login";

            throw refreshError;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const novoToken = await refreshPromise;

      originalRequest.headers.Authorization = `Bearer ${novoToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;