import React, { useState } from 'react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
  
    const handleLogin = () => {
      console.log('Email:', email);
      console.log('Password:', password);
    };
   
    const loginGoogle=()=>{
window.open(`http://localhost:8080/auth/google/callback`,"_self")
    }
  return (
    <div className="App">
      <div className="login-container">
        <h2>Login</h2>
        <div className="input-container">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="input-container">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button onClick={handleLogin}>Login</button>
      </div>
      <button onClick={loginGoogle}>Login With Google</button>
    </div>
  )
}
