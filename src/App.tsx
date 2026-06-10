import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spin } from 'antd';
import { AppShell } from './components/AppShell';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Editor = lazy(() => import('./pages/Editor'));
const Outline = lazy(() => import('./pages/Outline'));
const Roles = lazy(() => import('./pages/Roles'));
const RoleChat = lazy(() => import('./pages/RoleChat'));
const Bond = lazy(() => import('./pages/Bond'));
const Stats = lazy(() => import('./pages/Stats'));
const Settings = lazy(() => import('./pages/Settings'));
const Branches = lazy(() => import('./pages/Branches'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <Spin size="large" />
  </div>
);

const App: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/work/:workId" element={<Editor />} />
          <Route path="/work/:workId/outline" element={<Outline />} />
          <Route path="/work/:workId/characters" element={<Roles />} />
          <Route path="/work/:workId/characters/:charId/chat" element={<RoleChat />} />
          <Route path="/work/:workId/bonds" element={<Bond />} />
          <Route path="/work/:workId/stats" element={<Stats />} />
          <Route path="/work/:workId/branches" element={<Branches />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
