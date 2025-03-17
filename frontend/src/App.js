import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  BookOutlined,
  HistoryOutlined,
  SearchOutlined,
  RobotOutlined
} from '@ant-design/icons';
import HomePage from './pages/HomePage';
import RegulationsList from './pages/RegulationsList';
import RegulationDetail from './pages/RegulationDetail';
import Timeline from './pages/Timeline';
import AdminPage from './pages/AdminPage';

const { Header, Content, Footer } = Layout;

const App = () => {
  return (
    <Router>
      <Layout className="layout" style={{ minHeight: '100vh' }}>
        <Header>
          <div className="logo">LegalGuard</div>
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['1']}
            items={[
              {
                key: '1',
                icon: <HomeOutlined />,
                label: <Link to="/">首页</Link>,
              },
              {
                key: '2',
                icon: <BookOutlined />,
                label: <Link to="/regulations">法规库</Link>,
              },
              {
                key: '3',
                icon: <HistoryOutlined />,
                label: <Link to="/timeline">时间轴</Link>,
              },
              {
                key: '4',
                icon: <SearchOutlined />,
                label: <Link to="/regulations">法规查询</Link>,
              },
              {
                key: '5',
                icon: <RobotOutlined />,
                label: <Link to="/admin">管理</Link>,
              }
            ]}
          />
        </Header>
        <Content style={{ padding: '0 50px', marginTop: 20 }}>
          <div className="site-layout-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/regulations" element={<RegulationsList />} />
              <Route path="/regulations/:id" element={<RegulationDetail />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          LegalGuard ©{new Date().getFullYear()} 劳动法规合规智能监控系统
        </Footer>
      </Layout>
    </Router>
  );
};

export default App; 