import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import SnippetsPage from "./pages/SnippetsPage";
import CreateSnippetPage from "./pages/CreateSnippetPage";
import EditSnippetPage from "./pages/EditSnippetPage";
import ViewSnippetPage from "./pages/ViewSnippetPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0a0f] text-gray-100 font-sans">
        <nav className="border-b border-white/5 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-5 h-14 flex items-center">
            <Link to="/snippets" className="text-base font-mono font-semibold tracking-tight">
              dev<span className="text-amber-400">flow</span>
            </Link>
          </div>
        </nav>
        <main className="max-w-3xl mx-auto px-5 py-10">
          <Routes>
            <Route path="/" element={<Navigate to="/snippets" replace />} />
            <Route path="/snippets" element={<SnippetsPage />} />
            <Route path="/snippets/new" element={<CreateSnippetPage />} />
            <Route path="/snippets/:id" element={<ViewSnippetPage />} />
            <Route path="/snippets/:id/edit" element={<EditSnippetPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
