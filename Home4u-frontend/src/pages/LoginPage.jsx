import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
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
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>로그인</h2>
      <input name="username" placeholder="아이디" value={form.username} onChange={handleChange} />
      <input
        name="password"
        type="password"
        placeholder="비밀번호"
        value={form.password}
        onChange={handleChange}
      />
      {error && <p role="alert" style={{ color: '#c00' }}>{error}</p>}
      <button type="submit">로그인</button>
    </form>
  );
}

export default LoginPage;
