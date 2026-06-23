import React, { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import Home from './pages/Home.jsx';

// Standalone share/QR target — code-split so it stays out of the landing bundle.
const VideoView = lazy(() => import('./pages/VideoView.jsx'));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background text-foreground">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/video/:requestId" element={<VideoView />} />
          </Routes>
        </Suspense>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}
