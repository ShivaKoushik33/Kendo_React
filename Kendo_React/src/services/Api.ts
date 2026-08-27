import axios from "axios";

const Api = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true
}
);
Api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("AccessToken");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

let refreshPromise: Promise<string> | null = null;

const isAuthRoute = (url?: string) =>
    !!url && (url.includes("/auth/login") || url.includes("/auth/signup") || url.includes("/auth/refresh"));

Api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !isAuthRoute(originalRequest.url)
        ) {
            originalRequest._retry = true;

            try {
                if (!refreshPromise) {
                    refreshPromise = Api.post("/auth/refresh")
                        .then((response) => {
                            const newToken = response.data.accessToken;
                            localStorage.setItem("AccessToken", newToken);
                            return newToken;
                        })
                        .finally(() => {
                            refreshPromise = null;
                        });
                }

                const newToken = await refreshPromise;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                return Api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem("AccessToken");
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default Api;
