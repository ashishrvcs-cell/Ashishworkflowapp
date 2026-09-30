import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import AppLayout from "@/AppLayout";
import MorningCockpit from "@/pages/MorningCockpit";
import TodaysWork from "@/pages/TodaysWork";
import ClientMaster from "@/pages/ClientMaster";
import TaskTemplates from "@/pages/TaskTemplates";
import ClientAssignments from "@/pages/ClientAssignments";

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<MorningCockpit />} />
            <Route path="/today" element={<TodaysWork />} />
            <Route path="/clients" element={<ClientMaster />} />
            <Route path="/templates" element={<TaskTemplates />} />
            <Route path="/assignments" element={<ClientAssignments />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
