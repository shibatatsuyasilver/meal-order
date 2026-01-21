import React from 'react';
import { Layout, Menu } from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  HistoryOutlined,
  TableOutlined,
  MessageOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = ({ role, onSelect, onLogout, selectedKey }) => {
  const items = [
    {
      key: 'home',
      icon: <ShoppingCartOutlined />,
      label: 'Order Meal',
    },
    {
        key: 'chat',
        icon: <MessageOutlined />,
        label: 'AI Chat',
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: 'Chat History',
    },
    ...(role === 'seller'
      ? [
          {
            key: 'upload',
            icon: <UploadOutlined />,
            label: 'Upload Menu',
          },
          {
            key: 'tables',
            icon: <TableOutlined />,
            label: 'Table Manager',
          },
        ]
      : []),
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  const handleMenuClick = (e) => {
    if (e.key === 'logout') {
      onLogout();
    } else {
      onSelect(e.key);
    }
  };

  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="0"
      onBreakpoint={(broken) => {
        console.log(broken);
      }}
      onCollapse={(collapsed, type) => {
        console.log(collapsed, type);
      }}
      theme="light"
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        borderRight: '1px solid #f0f0f0'
      }}
    >
      <div style={{
          height: '64px',
          margin: '16px',
          background: 'rgba(0, 0, 0, 0.0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#1890ff'
      }}>
        Meal Order
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={items}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default Sidebar;