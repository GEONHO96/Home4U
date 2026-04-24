import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/userApi';
import SocialLoginButtons from '../components/SocialLoginButtons';

function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.role === 'ROLE_REALTOR' && (!form.licenseNumber.trim() || !form.agencyName.trim())) {
      setError('중개업자 번호와 중개업소 이름을 모두 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await registerUser(form);
      navigate('/login');
    } catch (err) {
      setError('회원가입 실패: ' + (err.response?.data?.message || err.message || '알 수 없는 오류'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container-narrow" style={{ padding: '3rem 1.25rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <h1 style={{ marginBottom: '0.3rem' }}>Home4U 시작하기</h1>
        <p className="muted" style={{ margin: 0 }}>
          구매자는 매물 검색과 거래 요청을, 공인중개사는 매물 등록을 바로 시작할 수 있습니다.
        </p>
      </div>

      <div className="card" style={{ padding: '1.75rem 1.5rem' }}>
        <SocialLoginButtons />
        <div className="divider" style={{ margin: '1.25rem 0' }}>또는 이메일로</div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <label>
              아이디
              <input name="username" value={form.username} onChange={handleChange} required />
            </label>
            <label>
              비밀번호
              <input name="password" type="password" value={form.password} onChange={handleChange} required />
            </label>
          </div>

          <label>
            이메일
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            전화번호 (선택)
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="010-0000-0000" />
          </label>

          <label>
            역할
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="ROLE_USER">일반 사용자 (구매자)</option>
              <option value="ROLE_REALTOR">공인중개사</option>
            </select>
          </label>

          {form.role === 'ROLE_REALTOR' && (
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
              <label>
                중개업자 번호
                <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} />
              </label>
              <label>
                중개업소 이름
                <input name="agencyName" value={form.agencyName} onChange={handleChange} />
              </label>
            </div>
          )}

          {error && (
            <div className="alert alert-error" role="alert">{error}</div>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? '계정 생성 중…' : '회원가입'}
          </button>
        </form>

        <p className="muted" style={{ textAlign: 'center', marginTop: '1rem', marginBottom: 0, fontSize: '0.9rem' }}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" style={{ color: 'var(--color-accent)', textDecorationColor: 'var(--color-accent)' }}>
            로그인
          </Link>
        </p>
      </div>
    </section>
  );
}

export default RegisterPage;
