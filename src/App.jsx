import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import useThemeToggle from "./hooks/useThemeToggle";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Front from "./pages/Front";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Home from "./pages/Home";
import Locker from "./pages/Locker";
import Amis from "./pages/Amis";
import Compte from "./pages/Compte";
import AddItem from "./pages/AddItem";
import PublicProfile from "./pages/PublicProfile";
import Favoris from "./pages/Favoris";
import Wishlist from "./pages/Wishlist";
import Parametres from "./pages/Parametres";
import Comparer from "./pages/Comparer";
import ItemDetail from "./pages/ItemDetail";
import AdminUsers from "./pages/AdminUsers";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminRoute from "./components/AdminRoute";

import "./App.css";

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ padding: 24 }}>Chargement…</p>;
  if (user) return <Navigate to="/home" replace />;
  return children;
}

function App() {
  useThemeToggle();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnly>
            <Front />
          </PublicOnly>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <Register />
          </PublicOnly>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/locker" element={<Locker />} />
        <Route path="/amis" element={<Amis />} />
        <Route path="/compte" element={<Compte />} />
        <Route path="/ajouter" element={<AddItem />} />
        <Route path="/profil/:username" element={<PublicProfile />} />
        <Route path="/favoris" element={<Favoris />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/parametres" element={<Parametres />} />
        <Route path="/comparer" element={<Comparer />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/user/:id"
          element={
            <AdminRoute>
              <AdminUserDetail />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
