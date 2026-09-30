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

// Task Templates (global, client-agnostic)
export const listTemplates = () => http.get("/templates").then((r) => r.data);
export const createTemplate = (body) => http.post("/templates", body).then((r) => r.data);
export const updateTemplate = (id, body) => http.patch(`/templates/${id}`, body).then((r) => r.data);
export const deleteTemplate = (id) => http.delete(`/templates/${id}`).then((r) => r.data);

// Client Assignments (map template -> client)
export const listAssignments = (params = {}) =>
  http.get("/assignments", { params }).then((r) => r.data);
export const createAssignment = (body) => http.post("/assignments", body).then((r) => r.data);
export const updateAssignment = (id, body) =>
  http.patch(`/assignments/${id}`, body).then((r) => r.data);
export const deleteAssignment = (id) => http.delete(`/assignments/${id}`).then((r) => r.data);

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
