import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
// 使用解构导入，webpack 的 Tree Shaking 会自动移除未使用的代码
import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  LoginOutlined,
  DashboardOutlined,
  UserOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  CheckSquareOutlined,
  TableOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import './AppLayout.css';

const { Header, Content, Sider } = Layout;

/**
 * 路由菜单配置
 */
const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '首页',
  },
  {
    key: '/login',
    icon: <LoginOutlined />,
    label: '登录',
  },
  {
    key: '/list',
    icon: <UnorderedListOutlined />,
    label: '列表页',
  },
  {
    key: '/detail',
    icon: <FileTextOutlined />,
    label: '详情页',
  },
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
    requireAuth: true,
  },
  {
    key: '/profile',
    icon: <UserOutlined />,
    label: '个人资料',
    requireAuth: true,
  },
  {
    key: '/tab',
    icon: <AppstoreOutlined />,
    label: '标签页',
  },
  {
    key: '/todo',
    icon: <CheckSquareOutlined />,
    label: '待办事项',
  },
  {
    key: '/visual-list',
    icon: <TableOutlined />,
    label: '虚拟列表',
  },
  {
    key: '/turntable',
    icon: <GiftOutlined />,
    label: '大转盘游戏',
  },
  {
    key: '/egg-frenzy',
    icon: <GiftOutlined />,
    label: '砸金蛋游戏',
  },
];

/**
 * 应用布局组件
 * 包含侧边栏菜单和主内容区域
 */
const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]);

  // 根据当前路径设置选中的菜单项
  useEffect(() => {
    const pathname = location.pathname;
    
    // 处理动态路由（如 /profile/:id）
    let currentKey = pathname;
    if (pathname.startsWith('/profile/')) {
      currentKey = '/profile';
    }
    
    setSelectedKeys([currentKey]);
  }, [location.pathname]);

  // 菜单点击处理
  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  // 过滤菜单项（可以根据权限等条件过滤）
  const filteredMenuItems = menuItems.filter(item => {
    // 这里可以根据用户权限过滤菜单项
    // if (item.requireAuth && !userInfo) {
    //   return false;
    // }
    return true;
  });

  return (
    <Layout className="app-layout" style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={200}
        theme="light"
        className="app-sider"
      >
        <div className="logo">
          {collapsed ? 'R' : 'React App'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={filteredMenuItems}
          onClick={handleMenuClick}
          style={{ height: '100%', borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="header-content">
            <h2>我的应用</h2>
            <img src="/OIP.webp" alt="Logo" className="header-logo" />
          </div>
        </Header>
        <Content className="app-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;

