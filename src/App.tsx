import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import PersonsPage from "./pages/PersonsPage";
import BookingsPage from "./pages/BookingsPage";
import RelationsPage from "./pages/RelationsPage";

import AdminPage from "./pages/AdminPage";
import ImportPage from "./pages/ImportPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthGate() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Login />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/persons" element={<PersonsPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/relations" element={<RelationsPage />} />
        
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AuthGate />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
