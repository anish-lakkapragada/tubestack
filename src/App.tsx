import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Channel from "./pages/Channel";
import Watch from "./pages/Watch";
import About from "./pages/About";
import Face from "./pages/Face";
import NavBar from "./components/NavBar";
import ArticleFind from "./components/ArticleFind";
import { AppProvider, useApp } from "./lib/AppContext";
import { HistorySidebar, WatchLaterSidebar } from "./components/Sidebar";

function AppShell() {
  const { sidebarOpen } = useApp();
  const location = useLocation();
  const hideChrome = location.pathname === "/face";
  const showSidebar = !hideChrome && sidebarOpen !== null;

  return (
    <div className={`app-shell ${showSidebar ? "sidebar-open" : ""}`}>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/channel" element={<Channel />} />
          <Route path="/watch" element={<Watch />} />
          <Route path="/about" element={<About />} />
          <Route path="/face" element={<Face />} />
        </Routes>
      </main>
      {showSidebar && sidebarOpen === "history" && <HistorySidebar />}
      {showSidebar && sidebarOpen === "later" && <WatchLaterSidebar />}
      {!hideChrome && <ArticleFind />}
      {!hideChrome && <NavBar />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppShell />
      </HashRouter>
    </AppProvider>
  );
}
