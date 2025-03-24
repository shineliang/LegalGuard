import React, { useState, useEffect } from 'react';
import { Typography, Table, Input, DatePicker, Space, Button, Tag } from 'antd';
import { SearchOutlined, BookOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { getRegulations } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const RegulationsList = () => {
  const [loading, setLoading] = useState(false);
  const [regulations, setRegulations] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    dateRange: null
  });

  const columns = [
    {
      title: '法规标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Link to={`/legalguard/regulations/${record.id}`}>{text}</Link>
      ),
      width: '40%'
    },
    {
      title: '发布日期',
      dataIndex: 'publish_date',
      key: 'publish_date',
      sorter: (a, b) => new Date(a.publish_date) - new Date(b.publish_date),
      width: '15%'
    },
    {
      title: '生效日期',
      dataIndex: 'effective_date',
      key: 'effective_date',
      render: (date) => date || '未知',
      width: '15%'
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: '15%'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="blue">{category || '未分类'}</Tag>
      ),
      width: '15%'
    }
  ];

  const fetchRegulations = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      
      // 构建查询参数
      const params = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        search: filters.search || undefined
      };
      
      // 添加日期范围过滤
      if (filters.dateRange) {
        const [startDate, endDate] = filters.dateRange;
        params.start_date = startDate.format('YYYY-MM-DD');
        params.end_date = endDate.format('YYYY-MM-DD');
      }
      
      const data = await getRegulations(params);
      
      setRegulations(data.regulations || []);
      setPagination({
        current: page,
        pageSize,
        total: data.total || 0
      });
    } catch (error) {
      console.error('获取法规列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegulations(pagination.current, pagination.pageSize);
  }, [filters]); // 当过滤条件变化时重新获取数据

  const handleTableChange = (paginationInfo) => {
    fetchRegulations(paginationInfo.current, paginationInfo.pageSize);
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 })); // 重置到第一页
  };

  const handleDateRangeChange = (dates) => {
    setFilters(prev => ({ ...prev, dateRange: dates }));
    setPagination(prev => ({ ...prev, current: 1 })); // 重置到第一页
  };

  const handleReset = () => {
    setFilters({
      search: '',
      dateRange: null
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  return (
    <div>
      <Title level={2}>法规库</Title>
      
      <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索法规标题或内容"
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            onPressEnter={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <RangePicker
            value={filters.dateRange}
            onChange={handleDateRangeChange}
            placeholder={['开始日期', '结束日期']}
          />
          <Button type="primary" onClick={() => handleSearch(filters.search)}>
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
        
        <Table
          columns={columns}
          dataSource={regulations}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </Space>
    </div>
  );
};

export default RegulationsList; 