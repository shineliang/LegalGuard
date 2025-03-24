import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Card, 
  Button, 
  Descriptions, 
  Spin, 
  Tabs, 
  message, 
  Divider,
  Space
} from 'antd';
import { 
  ArrowLeftOutlined, 
  BookOutlined, 
  RobotOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BuildOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { getRegulationDetail, interpretRegulation } from '../services/api';
import RegulationAnalysis from '../components/RegulationAnalysis';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const RegulationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [interpreting, setInterpreting] = useState(false);
  const [regulation, setRegulation] = useState(null);
  const [interpretations, setInterpretations] = useState([]);

  useEffect(() => {
    const fetchRegulationDetail = async () => {
      try {
        setLoading(true);
        const data = await getRegulationDetail(id);
        setRegulation(data.regulation);
        setInterpretations(data.interpretations || []);
      } catch (error) {
        console.error('获取法规详情失败:', error);
        message.error('获取法规详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchRegulationDetail();
  }, [id]);

  const handleInterpret = async () => {
    try {
      setInterpreting(true);
      message.info('正在生成法规解读，请稍候...');
      
      const data = await interpretRegulation(id);
      
      // 添加新的解读到列表
      setInterpretations(prev => [
        ...prev,
        {
          id: data.interpretation_id,
          interpretation: data.interpretation,
          created_at: new Date().toISOString()
        }
      ]);
      
      message.success('法规解读生成成功');
    } catch (error) {
      console.error('生成法规解读失败:', error);
      message.error('生成法规解读失败');
    } finally {
      setInterpreting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" tip="加载法规详情..." />
      </div>
    );
  }

  if (!regulation) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Title level={3}>未找到该法规</Title>
        <Button type="primary" onClick={() => navigate('/legalguard/regulations')}>
          返回法规列表
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button 
        type="link" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/legalguard/regulations')}
        style={{ marginBottom: 16, paddingLeft: 0 }}
      >
        返回法规列表
      </Button>

      <Title level={2}>{regulation.title}</Title>

      <Descriptions bordered style={{ marginBottom: 24 }}>
        <Descriptions.Item label="发布日期" span={1}>
          <Space>
            <ClockCircleOutlined />
            {regulation.publish_date}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="生效日期" span={1}>
          <Space>
            <BuildOutlined />
            {regulation.effective_date || '未指定'}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="来源" span={1}>
          <Space>
            <FileTextOutlined />
            {regulation.source}
          </Space>
        </Descriptions.Item>
      </Descriptions>

      <Tabs defaultActiveKey="1">
        <TabPane 
          tab={
            <span>
              <BookOutlined />
              法规原文
            </span>
          } 
          key="1"
        >
          <Card>
            <div className="regulation-content">
              {regulation.content.split('\n\n').map((paragraph, index) => (
                <Paragraph key={index}>{paragraph}</Paragraph>
              ))}
            </div>
          </Card>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <BulbOutlined />
              AI 解读
            </span>
          } 
          key="2"
        >
          <RegulationAnalysis regulationId={id} />
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <RobotOutlined />
              传统解读
              {interpretations.length > 0 && `(${interpretations.length})`}
            </span>
          } 
          key="3"
        >
          <Card>
            {interpretations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Paragraph>暂无传统解读，点击下方按钮生成</Paragraph>
                <Button 
                  type="primary" 
                  onClick={handleInterpret}
                  loading={interpreting}
                  disabled={interpreting}
                >
                  生成传统解读
                </Button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                  <Button 
                    type="primary" 
                    onClick={handleInterpret}
                    loading={interpreting}
                    disabled={interpreting}
                  >
                    生成新的解读
                  </Button>
                </div>
                
                {interpretations.map((item, index) => (
                  <div key={item.id || index}>
                    {index > 0 && <Divider />}
                    <div className="interpretation-content">
                      {item.interpretation}
                    </div>
                    {item.created_at && (
                      <div style={{ textAlign: 'right', marginTop: 8, color: '#888' }}>
                        解读生成时间: {new Date(item.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default RegulationDetail; 