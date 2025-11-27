import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./components/Dashboard/Dashboard";
import NhomNCManagement from "./components/NhomNC/NhomNCManagement";
import NhanVienManagement from "./components/NhanVien/NhanVienManagement";
import DeAnManagement from "./components/DeAn/DeAnManagement";
import Form1CrossGroupProjects from "./components/Query/Form1CrossGroupProjects";
import Form2UpdateRoomAndMoveFragment from "./components/Query/Form2UpdateRoomAndMoveFragment";
import Form3EmptyProjects from "./components/Query/Form3EmptyProjects";
import ThamGiaManagement from "./components/ThamGia/ThamGiaManagement";
import SystemHealth from "./components/Health/SystemHealth";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="nhomnc" element={<NhomNCManagement />} />
          <Route path="nhanvien" element={<NhanVienManagement />} />
          <Route path="dean" element={<DeAnManagement />} />
          <Route path="thamgia" element={<ThamGiaManagement />} />
          {/* Global Query Routes */}
          <Route path="query/form1" element={<Form1CrossGroupProjects />} />
          <Route
            path="query/form2"
            element={<Form2UpdateRoomAndMoveFragment />}
          />
          <Route path="query/form3" element={<Form3EmptyProjects />} />
          <Route path="health" element={<SystemHealth />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
