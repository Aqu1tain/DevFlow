import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SnippetsPage from "./pages/SnippetsPage";
import CreateSnippetPage from "./pages/CreateSnippetPage";
import EditSnippetPage from "./pages/EditSnippetPage";
import ViewSnippetPage from "./pages/ViewSnippetPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white">
        <header className="border-b border-gray-800 px-6 py-4">
          <a href="/snippets" className="text-2xl font-bold">
            Dev<span className="text-indigo-500">Flow</span>
          </a>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8">
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
