import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const http = axios.create({ baseURL: API });

export const getEsteiras = () => http.get("/esteiras").then((r) => r.data);
export const getProjects = () => http.get("/projects").then((r) => r.data);
export const getProject = (id) => http.get(`/projects/${id}`).then((r) => r.data);
export const completeStep = (id) => http.post(`/projects/${id}/complete-step`).then((r) => r.data);
export const resolvePendency = (id, pendId, body = {}) =>
  http.post(`/projects/${id}/pendencies/${pendId}/resolve`, body).then((r) => r.data);
export const createProject = (brief) => http.post("/projects", brief).then((r) => r.data);

export default http;
