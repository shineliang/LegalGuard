import axios from 'axios';

// 设置基础URL，根据您的实际后端地址进行修改
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 获取法规列表
export const getRegulations = async (params = {}) => {
  try {
    const response = await api.get('/regulations', { params });
    return response.data;
  } catch (error) {
    console.error('获取法规列表失败:', error);
    throw error;
  }
};

// 获取法规详情
export const getRegulationDetail = async (id) => {
  try {
    const response = await api.get(`/regulations/${id}`);
    return response.data;
  } catch (error) {
    console.error('获取法规详情失败:', error);
    throw error;
  }
};

// 获取法规解读（旧版）
export const interpretRegulation = async (id) => {
  try {
    const response = await api.post(`/regulations/${id}/interpret`);
    return response.data;
  } catch (error) {
    console.error('获取法规解读失败:', error);
    throw error;
  }
};

// 获取AI法规解读
export const getRegulationAnalysis = async (id) => {
  try {
    const response = await api.get(`/regulation/analyze/${id}`);
    return response.data;
  } catch (error) {
    console.error('获取AI法规解读失败:', error);
    throw error;
  }
};

// 刷新AI法规解读
export const refreshRegulationAnalysis = async (id) => {
  try {
    const response = await api.post(`/regulation/analyze/refresh/${id}`);
    return response.data;
  } catch (error) {
    console.error('刷新AI法规解读失败:', error);
    throw error;
  }
};

// 获取法规时间轴
export const getRegulationsTimeline = async (limit = 20) => {
  try {
    const response = await api.get('/timeline', { params: { limit } });
    return response.data;
  } catch (error) {
    console.error('获取法规时间轴失败:', error);
    throw error;
  }
};

// 运行爬虫
export const runCrawler = async (pages = 1) => {
  try {
    const response = await api.post('/crawler/run', { pages });
    return response.data;
  } catch (error) {
    console.error('运行爬虫失败:', error);
    throw error;
  }
};

export default {
  getRegulations,
  getRegulationDetail,
  interpretRegulation,
  getRegulationAnalysis,
  refreshRegulationAnalysis,
  getRegulationsTimeline,
  runCrawler
}; 