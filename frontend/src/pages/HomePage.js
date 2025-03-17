import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, List, Spin, Button } from 'antd';
import { FileTextOutlined, ClockCircleOutlined, ReadOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { getRegulations, getRegulationsTimeline } from '../services/api';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [recentRegulations, setRecentRegulations] = useState([]);
  const [stats, setStats] = useState({
    totalRegulations: 0,
    thisMonth: 0,
    thisYear: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 获取最新法规
        const regulationsData = await getRegulations({ limit: 5 });
        setRecentRegulations(regulationsData.regulations || []);
        
        // 计算统计数据
        const allRegulationsData = await getRegulations({ limit: 1000 });
        const allRegulations = allRegulationsData.regulations || [];
        
        // 计算本月和本年的法规数量
        const now = new Date();
        const thisMonth = now.getMonth() + 1;
        const thisYear = now.getFullYear();
        
        const thisMonthCount = allRegulations.filter(reg => {
          const date = new Date(reg.publish_date);
          return date.getMonth() + 1 === thisMonth && date.getFullYear() === thisYear;
        }).length;
        
        const thisYearCount = allRegulations.filter(reg => {
          const date = new Date(reg.publish_date);
          return date.getFullYear() === thisYear;
        }).length;
        
        setStats({
          totalRegulations: allRegulations.length,
          thisMonth: thisMonthCount,
          thisYear: thisYearCount
        });
      } catch (error) {
        console.error('获取首页数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <Title level={2}>劳动法规合规智能监控系统</Title>
      <Paragraph>
        欢迎使用LegalGuard系统，这是一个智能化的劳动法规监控和解读平台，帮助您轻松掌握最新劳动法规动态，确保企业合规运营。
      </Paragraph>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="法规总数"
              value={stats.totalRegulations}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="本月新增"
              value={stats.thisMonth}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="今年累计"
              value={stats.thisYear}
              prefix={<ReadOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Title level={3}>最新法规</Title>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={recentRegulations}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                title={<Link to={`/regulations/${item.id}`}>{item.title}</Link>}
                description={`发布日期: ${item.publish_date} | 来源: ${item.source}`}
              />
            </List.Item>
          )}
        />
      )}

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <Button type="primary" size="large">
          <Link to="/regulations">查看所有法规</Link>
        </Button>
        <Button style={{ marginLeft: 16 }} size="large">
          <Link to="/timeline">查看时间轴</Link>
        </Button>
      </div>
    </div>
  );
};

export default HomePage; 