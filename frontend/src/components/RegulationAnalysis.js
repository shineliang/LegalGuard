import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Spin, 
  List, 
  Tag, 
  Row, 
  Col, 
  Alert, 
  Divider,
  Space
} from 'antd';
import { 
  ReloadOutlined, 
  BulbOutlined, 
  SendOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  StarOutlined
} from '@ant-design/icons';
import { getRegulationAnalysis, refreshRegulationAnalysis } from '../services/api';

const { Title, Text, Paragraph } = Typography;

const RegulationAnalysis = ({ regulationId }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalysis();
  }, [regulationId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRegulationAnalysis(regulationId);
      setAnalysis(data);
    } catch (error) {
      console.error('获取法规解读失败:', error);
      const message = error.response?.data?.error || '获取法规解读失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await refreshRegulationAnalysis(regulationId);
      setAnalysis(data);
    } catch (error) {
      console.error('刷新法规解读失败:', error);
      const message = error.response?.data?.error || '刷新法规解读失败';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" tip="正在获取法规解读..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="获取解读失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" type="primary" onClick={fetchAnalysis}>
              重试
            </Button>
          }
        />
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Button 
            type="primary" 
            icon={<BulbOutlined />} 
            onClick={handleRefresh}
            loading={refreshing}
          >
            生成法规解读
          </Button>
        </div>
      </Card>
    );
  }

  if (!analysis && !loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <BulbOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={4}>暂无法规解读</Title>
          <Paragraph>点击下方按钮，使用AI分析法规内容</Paragraph>
          <Button 
            type="primary" 
            icon={<SendOutlined />} 
            loading={refreshing}
            onClick={handleRefresh}
          >
            生成法规解读
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={refreshing}
        >
          刷新解读
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>法规摘要</Title>
        <Paragraph>{analysis.summary}</Paragraph>
      </Card>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title={<><StarOutlined /> 关键要点</>} style={{ marginBottom: 16 }}>
            <List
              itemLayout="horizontal"
              dataSource={analysis.key_points || []}
              renderItem={(item, index) => (
                <List.Item>
                  <Space>
                    <Tag color="blue">{index + 1}</Tag>
                    <div>{item}</div>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<><TeamOutlined /> 适用对象</>} style={{ marginBottom: 16 }}>
            <List
              itemLayout="horizontal"
              dataSource={analysis.applicable_subjects || []}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <UserOutlined />
                    <div>{item}</div>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title="主要影响" style={{ marginBottom: 16 }}>
            <List
              itemLayout="horizontal"
              dataSource={analysis.main_impacts || []}
              renderItem={(item, index) => (
                <List.Item>
                  <Space>
                    <Tag color="orange">{index + 1}</Tag>
                    <div>{item}</div>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="实施指南" style={{ marginBottom: 16 }}>
            <List
              itemLayout="horizontal"
              dataSource={analysis.implementation_guide || []}
              renderItem={(item, index) => (
                <List.Item>
                  <Space>
                    <Tag color="green">{index + 1}</Tag>
                    <div>{item}</div>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {analysis.related_regulations && analysis.related_regulations.length > 0 && (
        <Card title={<><FileTextOutlined /> 相关法规</>}>
          <List
            itemLayout="horizontal"
            dataSource={analysis.related_regulations}
            renderItem={(item) => (
              <List.Item>
                <div>{item}</div>
              </List.Item>
            )}
          />
        </Card>
      )}

      {analysis.created_at && (
        <div style={{ textAlign: 'right', marginTop: 8, color: '#888' }}>
          解读生成时间: {new Date(analysis.created_at).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default RegulationAnalysis; 