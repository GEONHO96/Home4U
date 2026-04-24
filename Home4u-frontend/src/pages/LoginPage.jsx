import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import SocialLoginButtons from '../components/SocialLoginButtons';

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await axiosInstance.post('/users/login', form);
      const { token, userId, username, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', String(userId));
      localStorage.setItem('username', username);
      localStorage.setItem('role', role);
      navigate('/properties');
    } catch (err) {
      setError(err.response?.data?.message || err.message || '로그인 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container-narrow" style={{ padding: '3rem 1.25rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <h1 style={{ marginBottom: '0.3rem' }}>다시 만나요</h1>
        <p className="muted" style={{ margin: 0 }}>
          Home4U 계정으로 로그인하고 매물과 거래를 확인하세요.
        </p>
      </div>

      <div className="card" style={{ padding: '1.75rem 1.5rem' }}>
        <SocialLoginButtons />

        <div className="divider" style={{ margin: '1.25rem 0' }}>또는 이메일로</div>

        <form onSubmit={handleLogin} style={{ display: 'grid', gap: '0.85rem' }}>
          <label>
            아이디
            <input
              name="username"
              placeholder="사용자명"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </label>
          <label>
            비밀번호
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <div className="alert alert-error" role="alert">{error}</div>
          )}
          <button type="submit" disabled={submitting}>
            {submitting ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <p className="muted" style={{ textAlign: 'center', marginTop: '1rem', marginBottom: 0, fontSize: '0.9rem' }}>
          아직 계정이 없으신가요?{' '}
          <Link to="/register" style={{ color: 'var(--color-accent)', textDecorationColor: 'var(--color-accent)' }}>
            회원가입
          </Link>
        </p>
      </div>
    </section>
  );
}

export default LoginPage;
