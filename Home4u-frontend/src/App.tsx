import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PropertyListPage from './pages/PropertyListPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import PropertyCreatePage from './pages/PropertyCreatePage';
import TransactionsPage from './pages/TransactionsPage';
import './App.css';

function Home() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <section>
      <h1>Home4U</h1>
      <p>부동산 매물 거래 플랫폼</p>

      <nav style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link to="/properties">매물 목록</Link>
        {username ? (
          <>
            <Link to="/transactions/me">내 거래</Link>
            {role === 'ROLE_REALTOR' && <Link to="/properties/new">매물 등록</Link>}
            <span>
              {username}
              {role === 'ROLE_REALTOR' && ' (공인중개사)'}
            </span>
            <button type="button" onClick={logout}>로그아웃</button>
          </>
        ) : (
          <>
            <Link to="/register">회원가입</Link>
            <Link to="/login">로그인</Link>
          </>
        )}
      </nav>
    </section>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/properties" element={<PropertyListPage />} />
      <Route path="/properties/new" element={<PropertyCreatePage />} />
      <Route path="/properties/:id" element={<PropertyDetailPage />} />
      <Route path="/transactions/me" element={<TransactionsPage />} />
    </Routes>
  );
}

export default App;
