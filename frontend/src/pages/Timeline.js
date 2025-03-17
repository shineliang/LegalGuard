import React, { useState, useEffect, useRef } from 'react';
import { Typography, Spin, Card, Button, Empty, Tag, Tooltip, Avatar, Input, Select, DatePicker, Space, Divider, Badge } from 'antd';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { 
  BookOutlined, 
  ReadOutlined, 
  FileTextOutlined,
  CalendarOutlined,
  BulbOutlined,
  TagOutlined,
  BankOutlined,
  ArrowDownOutlined,
  HistoryOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getRegulationsTimeline } from '../services/api';
import './Timeline.css';

const { Title, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 自定义时间轴年份的主题色
const YEAR_THEMES = {
  '2024': { bg: '#1890ff', icon: <CalendarOutlined /> },
  '2023': { bg: '#52c41a', icon: <CalendarOutlined /> },
  '2022': { bg: '#722ed1', icon: <CalendarOutlined /> },
  '2021': { bg: '#fa8c16', icon: <CalendarOutlined /> },
  '2020': { bg: '#eb2f96', icon: <CalendarOutlined /> },
  'default': { bg: '#1890ff', icon: <CalendarOutlined /> }
};

// 图标映射
const CATEGORY_ICONS = {
  '法律法规': <BankOutlined />,
  '司法解释': <BulbOutlined />,
  '部门规章': <FileTextOutlined />,
  '法律法规解读': <BookOutlined />,
  'default': <TagOutlined />
};

const Timeline = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [regulations, setRegulations] = useState([]);
  const [filteredRegulations, setFilteredRegulations] = useState([]);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const timelineRef = useRef(null);
  const [showYearNav, setShowYearNav] = useState(false);

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        setLoading(true);
        const data = await getRegulationsTimeline(limit);
        const regs = data.regulations || [];
        setRegulations(regs);
        setFilteredRegulations(regs);
      } catch (error) {
        console.error('获取时间轴数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, [limit]);

  useEffect(() => {
    // 应用筛选器
    let filtered = [...regulations];
    
    // 按搜索文本筛选
    if (searchText) {
      filtered = filtered.filter(reg => 
        reg.title.toLowerCase().includes(searchText.toLowerCase()) || 
        (reg.source && reg.source.toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    
    // 按分类筛选
    if (categoryFilter) {
      filtered = filtered.filter(reg => reg.category === categoryFilter);
    }
    
    // 按日期范围筛选
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      filtered = filtered.filter(reg => {
        const pubDate = new Date(reg.publish_date);
        return pubDate >= startDate.toDate() && pubDate <= endDate.toDate();
      });
    }
    
    setFilteredRegulations(filtered);
  }, [searchText, categoryFilter, dateRange, regulations]);

  // 监听滚动以显示/隐藏年份导航
  useEffect(() => {
    const handleScroll = () => {
      if (timelineRef.current) {
        const timelineTop = timelineRef.current.getBoundingClientRect().top;
        setShowYearNav(timelineTop < 0);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // 滚动到特定年份
  const scrollToYear = (year) => {
    const yearElement = document.getElementById(`year-${year}`);
    if (yearElement) {
      yearElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLoadMore = () => {
    setLimit(prev => prev + 10);
  };

  const handleViewDetail = (id) => {
    navigate(`/regulations/${id}`);
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };
  
  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
  };
  
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };
  
  const handleClearFilters = () => {
    setSearchText('');
    setCategoryFilter('');
    setDateRange(null);
  };

  // 获取年份主题配置
  const getYearTheme = (year) => {
    return YEAR_THEMES[year] || YEAR_THEMES.default;
  };

  // 获取分类图标
  const getCategoryIcon = (category) => {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
  };
  
  // 获取所有可用的分类
  const getCategories = () => {
    const categories = new Set();
    regulations.forEach(reg => {
      if (reg.category) {
        categories.add(reg.category);
      }
    });
    return Array.from(categories);
  };

  // 显示筛选结果数
  const renderFilterSummary = () => {
    if (filteredRegulations.length === regulations.length) {
      return null;
    }
    
    return (
      <div className="filter-summary">
        <Badge 
          count={filteredRegulations.length} 
          overflowCount={999}
          style={{ backgroundColor: '#1890ff', marginRight: '8px' }} 
        />
        <span>筛选结果</span>
        {(searchText || categoryFilter || dateRange) && (
          <Button 
            type="link" 
            size="small" 
            onClick={handleClearFilters}
            style={{ marginLeft: '8px' }}
          >
            清除筛选条件
          </Button>
        )}
      </div>
    );
  };

  if (loading && regulations.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '50vh'
      }}>
        <HistoryOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 20 }} />
        <Spin size="large" tip="加载时间轴数据..." />
      </div>
    );
  }

  if (regulations.length === 0) {
    return (
      <div className="timeline-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <Card bordered={false} className="timeline-header-card">
          <Title level={2}><HistoryOutlined /> 法规时间轴</Title>
          <Empty description="暂无法规数据" />
        </Card>
      </div>
    );
  }

  // 对法规按发布日期进行分组
  const groupedRegulations = filteredRegulations.reduce((acc, reg) => {
    const year = new Date(reg.publish_date).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(reg);
    return acc;
  }, {});

  // 排序年份（降序）
  const sortedYears = Object.keys(groupedRegulations).sort((a, b) => b - a);

  return (
    <div className="timeline-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div className="timeline-background-decoration"></div>
      
      {/* 年份导航栏 */}
      {showYearNav && sortedYears.length > 0 && (
        <div className="year-navigation">
          <div className="year-navigation-inner">
            {sortedYears.map(year => (
              <Button 
                key={year}
                type="text"
                size="small"
                onClick={() => scrollToYear(year)}
                style={{
                  margin: '0 5px',
                  fontWeight: 'bold',
                  color: getYearTheme(year).bg
                }}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <Card 
        bordered={false} 
        className="timeline-header-card"
        style={{ 
          borderRadius: '12px', 
          marginBottom: '30px', 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4edf9 100%)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1
        }}
      >
        <div className="header-decoration-circle"></div>
        <div className="header-decoration-circle header-decoration-circle-2"></div>
        
        <Title level={2} style={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <HistoryOutlined style={{ marginRight: '12px' }} /> 法规时间轴
        </Title>
        <Paragraph style={{ fontSize: '16px', maxWidth: '800px', position: 'relative', zIndex: 2 }}>
          按照发布时间查看法规变化历程，了解劳动法规的演变与发展。
        </Paragraph>
        
        <Card 
          bordered={false}
          style={{ 
            marginTop: '20px', 
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(4px)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Search
              placeholder="搜索法规标题或来源"
              allowClear
              enterButton={<><SearchOutlined /> 搜索</>}
              size="middle"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onSearch={handleSearch}
              style={{ maxWidth: '500px' }}
            />
            
            <Space wrap>
              <Space>
                <FilterOutlined /> 筛选:
              </Space>
              
              <Select
                placeholder="选择分类"
                style={{ width: 180 }}
                value={categoryFilter}
                onChange={handleCategoryChange}
                allowClear
              >
                {getCategories().map(category => (
                  <Option key={category} value={category}>
                    {getCategoryIcon(category)} {category}
                  </Option>
                ))}
              </Select>
              
              <RangePicker 
                placeholder={['开始日期', '结束日期']}
                value={dateRange}
                onChange={handleDateRangeChange}
              />
              
              <Button 
                onClick={handleClearFilters} 
                size="middle" 
                disabled={!searchText && !categoryFilter && !dateRange}
              >
                清除筛选
              </Button>
            </Space>
            
            {renderFilterSummary()}
          </Space>
        </Card>
      </Card>

      {sortedYears.length === 0 ? (
        <Empty description="没有符合条件的法规" />
      ) : (
        <VerticalTimeline animate={true} lineColor="#f0f0f0" ref={timelineRef}>
          {sortedYears.map(year => {
            const yearTheme = getYearTheme(year);
            return (
            <React.Fragment key={year}>
              <VerticalTimelineElement
                id={`year-${year}`}
                className="vertical-timeline-element--year"
                contentStyle={{ 
                  background: yearTheme.bg, 
                  color: '#fff', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
                contentArrowStyle={{ borderRight: `7px solid ${yearTheme.bg}` }}
                date={
                  <span style={{ 
                    fontWeight: 'bold', 
                    fontSize: '18px',
                    padding: '6px 12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '20px',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.06)',
                    color: yearTheme.bg
                  }}>
                    {year}
                  </span>
                }
                iconStyle={{ 
                  background: yearTheme.bg, 
                  color: '#fff',
                  boxShadow: '0 0 0 4px #fff, 0 0 0 5px rgba(0, 0, 0, 0.1), 0 0 30px rgba(0, 0, 0, 0.1)'
                }}
                icon={yearTheme.icon}
              >
                <h3 className="vertical-timeline-element-title" style={{ fontSize: '20px', margin: '0 0 8px' }}>
                  {year}年
                </h3>
                <p style={{ 
                  display: 'inline-block',
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  共 {groupedRegulations[year].length} 项法规政策
                </p>
              </VerticalTimelineElement>

              {groupedRegulations[year].map(regulation => (
                <VerticalTimelineElement
                  key={regulation.id}
                  className="vertical-timeline-element--regulation"
                  date={
                    <Tooltip title="发布日期">
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#555'
                      }}>
                        <CalendarOutlined style={{ marginRight: '6px' }} />
                        {regulation.publish_date}
                      </span>
                    </Tooltip>
                  }
                  iconStyle={{ 
                    background: '#fff', 
                    color: yearTheme.bg,
                    boxShadow: '0 0 0 3px #f0f0f0, 0 5px 10px rgba(0, 0, 0, 0.1)' 
                  }}
                  icon={getCategoryIcon(regulation.category)}
                  contentStyle={{
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #f0f0f0',
                    padding: '24px'
                  }}
                >
                  <h3 className="vertical-timeline-element-title" style={{ 
                    fontSize: '16px', 
                    margin: '0 0 12px',
                    fontWeight: '600'
                  }}>
                    {regulation.title}
                  </h3>
                  
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                    <BankOutlined style={{ color: '#888', marginRight: '6px' }} />
                    <span style={{ color: '#666', fontSize: '14px' }}>
                      来源: {regulation.source}
                    </span>
                  </div>
                  
                  {regulation.category && (
                    <div style={{ marginBottom: '16px' }}>
                      <Tag color={yearTheme.bg} icon={getCategoryIcon(regulation.category)}>
                        {regulation.category}
                      </Tag>
                    </div>
                  )}
                  
                  <Button 
                    type="primary" 
                    size="middle" 
                    onClick={() => handleViewDetail(regulation.id)}
                    icon={<ReadOutlined />}
                    style={{ 
                      marginTop: 12,
                      background: yearTheme.bg,
                      border: 'none',
                      borderRadius: '6px',
                      boxShadow: '0 2px 0 rgba(0,0,0,0.045)'
                    }}
                  >
                    查看详情
                  </Button>
                </VerticalTimelineElement>
              ))}
            </React.Fragment>
          )})}
        </VerticalTimeline>
      )}

      {!loading && filteredRegulations.length === regulations.length && regulations.length >= limit && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: 40, 
          marginBottom: 40,
          padding: '20px' 
        }}>
          <Button 
            type="primary" 
            size="large"
            onClick={handleLoadMore}
            icon={<ArrowDownOutlined />}
            style={{
              height: '48px',
              padding: '0 24px',
              fontSize: '16px',
              borderRadius: '24px',
              background: 'linear-gradient(45deg, #1890ff, #096dd9)',
              border: 'none',
              boxShadow: '0 6px 16px rgba(24, 144, 255, 0.25)'
            }}
          >
            加载更多法规
          </Button>
        </div>
      )}
    </div>
  );
};

export default Timeline; 