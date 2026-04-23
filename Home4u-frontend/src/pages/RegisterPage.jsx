import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/userApi';

function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'ROLE_USER',
    licenseNumber: '',
    agencyName: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.role === 'ROLE_REALTOR' && (!form.licenseNumber.trim() || !form.agencyName.trim())) {
      setError('중개업자 번호와 중개업소 이름을 모두 입력해주세요.');
      return;
    }

    try {
      await registerUser(form);
      navigate('/login');
    } catch (err) {
      setError('회원가입 실패: ' + (err.response?.data?.message || err.message || '알 수 없는 오류'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>회원가입</h2>
      <input
        name="username"
        placeholder="아이디"
        value={form.username}
        onChange={handleChange}
        required
      />
      <input
        name="password"
        type="password"
        placeholder="비밀번호"
        value={form.password}
        onChange={handleChange}
        required
      />
      <input
        name="email"
        placeholder="이메일"
        value={form.email}
        onChange={handleChange}
        required
      />
      <input name="phone" placeholder="전화번호" value={form.phone} onChange={handleChange} />

      <select name="role" value={form.role} onChange={handleChange}>
        <option value="ROLE_USER">일반 사용자</option>
        <option value="ROLE_REALTOR">공인중개사</option>
      </select>

      {form.role === 'ROLE_REALTOR' && (
        <>
          <input
            name="licenseNumber"
            placeholder="중개업자 번호"
            value={form.licenseNumber}
            onChange={handleChange}
          />
          <input
            name="agencyName"
            placeholder="중개업소 이름"
            value={form.agencyName}
            onChange={handleChange}
          />
        </>
      )}

      {error && <p role="alert" style={{ color: '#c00' }}>{error}</p>}

      <button type="submit">회원가입</button>
    </form>
  );
}

export default RegisterPage;
