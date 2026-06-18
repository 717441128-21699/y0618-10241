import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import VideoPage from './pages/VideoPage';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './store/useAuthStore';

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/video/:id" element={<VideoPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
        <footer className="py-10 px-6 border-t border-border-subtle text-center text-text-muted text-sm mt-10">
          <p className="font-display gradient-text text-base font-bold mb-2">CloudStream</p>
          <p>© 2026 CloudStream VOD Platform · 让好内容触手可及</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
