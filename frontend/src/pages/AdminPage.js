import React, { useState } from 'react';
import { Typography, Card, Button, InputNumber, Form, message, Alert, Spin, Divider, Space } from 'antd';
import { CloudDownloadOutlined, RobotOutlined, DatabaseOutlined } from '@ant-design/icons';
import { runCrawler } from '../services/api';

const { Title, Paragraph } = Typography;

const AdminPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form] = Form.useForm();

  const handleRunCrawler = async (values) => {
    try {
      setLoading(true);
      setResult(null);
      
      message.info('正在启动爬虫任务，请稍候...');
      const data = await runCrawler(values.pages);
      
      setResult({
        success: true,
        message: data.message
      });
      
      message.success('爬虫任务完成');
    } catch (error) {
      console.error('运行爬虫失败:', error);
      setResult({
        success: false,
        message: error.response?.data?.error || '运行爬虫失败，请检查后端服务是否正常运行'
      });
      message.error('爬虫任务失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>系统管理</Title>
      <Paragraph>
        在此页面可以执行系统管理操作，包括爬取最新法规、管理数据库等。
      </Paragraph>

      <Card 
        title={
          <Space>
            <CloudDownloadOutlined />
            爬取最新法规
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Paragraph>
          从人力资源和社会保障部网站爬取最新的劳动法规，并保存到数据库中。
        </Paragraph>
        
        <Form
          form={form}
          onFinish={handleRunCrawler}
          initialValues={{ pages: 3 }}
          layout="inline"
        >
          <Form.Item
            name="pages"
            label="爬取页数"
            rules={[{ required: true, message: '请输入要爬取的页数' }]}
          >
            <InputNumber min={1} max={10} />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<CloudDownloadOutlined />}
            >
              开始爬取
            </Button>
          </Form.Item>
        </Form>
        
        {loading && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Spin tip="正在爬取数据，请耐心等待..." />
          </div>
        )}
        
        {result && (
          <Alert
            style={{ marginTop: 16 }}
            message={result.success ? "爬虫任务成功" : "爬虫任务失败"}
            description={result.message}
            type={result.success ? "success" : "error"}
            showIcon
          />
        )}
      </Card>
      
      <Card 
        title={
          <Space>
            <RobotOutlined />
            LLM配置
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Paragraph>
          系统使用OpenAI API进行法规解读。请确保已在后端配置了正确的API密钥。
        </Paragraph>
        <Alert
          message="配置提示"
          description="请在后端服务器的.env文件中配置OPENAI_API_KEY等参数。"
          type="info"
          showIcon
        />
      </Card>
      
      <Card 
        title={
          <Space>
            <DatabaseOutlined />
            数据库信息
          </Space>
        }
      >
        <Paragraph>
          系统使用SQLite数据库存储法规和解读数据。数据库文件位于后端服务器的database目录中。
        </Paragraph>
        <Divider />
        <Paragraph>
          <strong>数据库文件路径:</strong> database/legalguard.db
        </Paragraph>
        <Paragraph>
          <strong>数据表:</strong> regulations, interpretations
        </Paragraph>
      </Card>
    </div>
  );
};

export default AdminPage; 