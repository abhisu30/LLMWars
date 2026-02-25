import { Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header.tsx";
import { ComparePage } from "./pages/ComparePage.tsx";
import { AdminPage } from "./pages/AdminPage.tsx";
import { HistoryPage } from "./pages/HistoryPage.tsx";

function App() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Header />
      <main className="p-4">
        <Routes>
          <Route path="/" element={<ComparePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
