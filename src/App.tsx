import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Channel from "./pages/Channel";
import Watch from "./pages/Watch";
import About from "./pages/About";
import NavBar from "./components/NavBar";
import { AppProvider, useApp } from "./lib/AppContext";
import { HistorySidebar, WatchLaterSidebar } from "./components/Sidebar";

function AppShell() {
  const { sidebarOpen } = useApp();

  return (
    <>
      <div className="titlebar" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/channel" element={<Channel />} />
        <Route path="/watch" element={<Watch />} />
        <Route path="/about" element={<About />} />
      </Routes>
      {sidebarOpen === "history" && <HistorySidebar />}
      {sidebarOpen === "later" && <WatchLaterSidebar />}
      <NavBar />
    </>
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
