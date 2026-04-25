import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PropertyListPage from './pages/PropertyListPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import PropertyCreatePage from './pages/PropertyCreatePage';
import TransactionsPage from './pages/TransactionsPage';
import FavoritesPage from './pages/FavoritesPage';
import SavedSearchesPage from './pages/SavedSearchesPage';
import ChatListPage from './pages/ChatListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import AdminPage from './pages/AdminPage';
import InstallPrompt from './components/InstallPrompt';
import './App.css';

function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/properties" element={<PropertyListPage />} />
          <Route path="/properties/new" element={<PropertyCreatePage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/transactions/me" element={<TransactionsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/saved-searches" element={<SavedSearchesPage />} />
          <Route path="/chats" element={<ChatListPage />} />
          <Route path="/chats/:roomId" element={<ChatRoomPage />} />
          <Route path="/oauth/:provider/callback" element={<OAuthCallbackPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
      <InstallPrompt />
    </>
  );
}

export default App;
