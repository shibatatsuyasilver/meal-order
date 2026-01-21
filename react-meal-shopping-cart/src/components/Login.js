import React, { useState } from 'react';
import { login } from './api';
import { Form, Input, Button, Card, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined, FacebookFilled, XOutlined, WechatOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title } = Typography;

const Login = ({ onLoginSuccess }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000");

  const onFinish = async (values) => {
    setLoading(true);
    setError('');

    try {
      const response = await login(values.username, values.password);
      // Expected response: { access_token: "...", token_type: "bearer", role: "..." }
      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('role', response.data.role || 'user'); // Store role
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setError('Login failed: Invalid response');
      }
    } catch (err) {
      console.error(err);
      setError('Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f0f2f5' 
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Title level={2} style={{ color: '#1890ff', margin: 0 }}>Meal Order</Title>
          <Title level={4} style={{ marginTop: '0.5rem', fontWeight: 'normal' }}>Welcome Back</Title>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: '1rem' }}
          />
        )}

        <Form
          name="login"
          initialValues={{ username: 'test_seller', password: 'password123' }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your Username!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Log in
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>

        <Divider>Or Login with</Divider>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button
            href={`${BACKEND_URL}/auth/login/google`}
            icon={<GoogleOutlined />}
            block
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Sign in with Google
          </Button>
          <Button
            href={`${BACKEND_URL}/auth/login/facebook`}
            icon={<FacebookFilled />}
            block
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Sign in with Facebook
          </Button>
          <Button
            href={`${BACKEND_URL}/auth/login/twitter`}
            icon={<XOutlined />}
            block
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Sign in with X
          </Button>
          <Button
            href={`${BACKEND_URL}/auth/login/line`}
            icon={<WechatOutlined />} // Using WeChat icon as placeholder for LINE
            block
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Sign in with LINE
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Login;