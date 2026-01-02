// Login.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const from = '/dashboard';

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ email, password });
    navigate(from, { replace: true });
    // setError('');
    // setLoading(true);

    // try {
    //   await login(email, password);
    //   navigate(from, { replace: true });
    // } catch (err) {
    //   setError(err.message);
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>用户登录</h2>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label>邮箱:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            // required
            placeholder="user@example.com"
          />
        </div>

        <div className="form-group">
          <label>密码:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            // required
            placeholder="password"
          />
        </div>

        <button type="submit" disabled={loading} className="login-btn">
          {loading ? '登录中...' : '登录'}
        </button>

        <div className="demo-credentials">
          <p>演示账号:</p>
          <p>邮箱: user@example.com</p>
          <p>密码: password</p>
        </div>
      </form>
    </div>
  );
}

export default Login;