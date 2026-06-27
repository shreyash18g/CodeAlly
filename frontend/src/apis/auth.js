import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");

  const publicRoutes = [
    "/api/auth/login/",
    "/api/auth/register/",
  ];

  const isPublic = publicRoutes.some((route) =>
    config.url.includes(route)
  );

  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const login = (email, password) => {
  return API.post("/api/auth/login/", {
    email,
    password,
  });
};

export const register = (
  firstname,
  lastname,
  email,
  password
) => {
  return API.post("/api/auth/register/", {
    firstname,
    lastname,
    email,
    password,
  });
};

export const fetchProblems = () => {
  return API.get("/api/problems/");
}; 
export const fetchSolvedProblems = () => {
  return API.get("/api/auth/solved/");
}; 
export const fetchProblemByNumber = (problemNumber) => {
  return API.get(`/api/problems/${problemNumber}/`);
};
export const getSubmissionStatus = (id) => {
  return API.get(`/api/submissions/${id}/`);
}; 
export const getSubmissionHistory = () => {
  return API.get("/api/submissions/history/");
};
export const getProfile = () => {
  return API.get("/api/auth/profile/");
};
export const fetchLeaderboard = () => {
  return API.get("/api/leaderboard/");
};
export const runCode = (code, input, language = "cpp") => {
  return API.post("/api/judge/run/", {
    code,
    input,
    language,
  });
};
export const submitCode = (code, language, problemNumber) => {
  return API.post("/api/judge/submit/", {
    problemNumber: parseInt(problemNumber, 10),
    language,
    code,
  });
};
export const createProblem = (data) => {
  return API.post(
    "/api/problems/admin/create/",
    data
  );
}; 
export const getGeminiFeedback = (
  code,
  language,
  title,
  description,
  input,
  output
) => {
  return API.post("/api/gemini/feedback/", {
    code,
    language,
    title,
    description,
    input,
    output,
  });
};

export const deleteProblem = (problemNumber) => {
  return API.delete(
    `/api/problems/admin/delete/${problemNumber}/`
  );
};
export default API;