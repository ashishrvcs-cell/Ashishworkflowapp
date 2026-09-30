import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const http = axios.create({ baseURL: API, timeout: 20000 });

// Staff
export const listStaff = () => http.get("/staff").then((r) => r.data);
export const createStaff = (body) => http.post("/staff", body).then((r) => r.data);
export const updateStaff = (id, body) => http.patch(`/staff/${id}`, body).then((r) => r.data);
export const deleteStaff = (id) => http.delete(`/staff/${id}`).then((r) => r.data);

// Clients
export const listClients = () => http.get("/clients").then((r) => r.data);
export const createClient = (body) => http.post("/clients", body).then((r) => r.data);
export const updateClient = (id, body) => http.patch(`/clients/${id}`, body).then((r) => r.data);
export const deleteClient = (id) => http.delete(`/clients/${id}`).then((r) => r.data);

// Rules
export const listRules = () => http.get("/rules").then((r) => r.data);
export const createRule = (body) => http.post("/rules", body).then((r) => r.data);
export const updateRule = (id, body) => http.patch(`/rules/${id}`, body).then((r) => r.data);
export const deleteRule = (id) => http.delete(`/rules/${id}`).then((r) => r.data);

// Tasks
export const listTasks = (params = {}) => http.get("/tasks", { params }).then((r) => r.data);
export const createTask = (body) => http.post("/tasks", body).then((r) => r.data);
export const updateTask = (id, body) => http.patch(`/tasks/${id}`, body).then((r) => r.data);
export const deleteTask = (id) => http.delete(`/tasks/${id}`).then((r) => r.data);
export const generateToday = () => http.post("/tasks/generate_today").then((r) => r.data);

// Dashboard
export const dashboardStats = () => http.get("/dashboard/stats").then((r) => r.data);

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const daysBetween = (a, b) => {
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  return Math.round((d2 - d1) / (24 * 3600 * 1000));
};
