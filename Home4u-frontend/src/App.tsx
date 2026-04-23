import { Link, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './App.css';

function Home() {
  return (
    <section>
      <h1>Home4U</h1>
      <p>부동산 매물 거래 플랫폼</p>
      <nav style={{ display: 'flex', gap: '0.75rem' }}>
        <Link to="/register">회원가입</Link>
        <Link to="/login">로그인</Link>
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
    </Routes>
  );
}

export default App;
