import React, { useState } from 'react';
import { loginUser } from '../api/userApi';

function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const token = await loginUser(form); // ✅ username, password 포함 객체 전달
      localStorage.setItem('token', token);
      alert('로그인 성공!');
      // TODO: 라우팅 이동 추가
    } catch (err) {
      alert('로그인 실패: ' + (err.message || '서버 오류'));
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
      <button type="submit">로그인</button>
    </form>
  );
}

export default LoginPage;
