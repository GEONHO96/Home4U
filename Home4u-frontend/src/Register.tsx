import { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'ROLE_USER', // ROLE_USER 또는 ROLE_REALTOR
    agencyName: '',
    licenseNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/users/register', formData);
      alert(response.data.message);
    } catch (error) {
      alert('회원가입 실패');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" onChange={handleChange} placeholder="Username" />
      <input name="password" type="password" onChange={handleChange} placeholder="Password" />
      <input name="email" type="email" onChange={handleChange} placeholder="Email" />
      <button type="submit">회원가입</button>
    </form>
  );
};

export default Register;
