import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', {
        email,
        password,
      });
      // Assuming the backend returns a token
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard'); // Redirect to the dashboard or home page after login
    } catch (error) {
      setError('Invalid login credentials, please try again.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-body">
          <h2 className="text-center">Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label>Email:</label>
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label>Password:</label>
              <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-100">Login</button>
          </form>
          {error && <p className="text-danger mt-3">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Login;
