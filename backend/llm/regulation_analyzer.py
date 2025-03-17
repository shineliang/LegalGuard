import os
import json
import requests
from typing import Dict, Any, Optional

class RegulationAnalyzer:
    """法规解读模块 - 调用LLM API解读法规内容"""
    
    def __init__(self, api_key: Optional[str] = None):
        """初始化法规解读器
        
        Args:
            api_key: LLM API密钥，如果为None则从环境变量LLM_API_KEY获取
        """
        self.api_key = api_key or os.environ.get("LLM_API_KEY")
        if not self.api_key:
            raise ValueError("缺少LLM API密钥，请设置LLM_API_KEY环境变量或在初始化时提供")
        
        # API端点和请求头，这里以通用格式为例，实际使用时根据选择的API进行修改
        self.api_endpoint = os.environ.get("LLM_API_ENDPOINT", "https://api.example.com/v1/chat/completions")
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
    def analyze_regulation(self, title: str, content: str) -> Dict[str, Any]:
        """分析法规内容，提取重点并生成解读
        
        Args:
            title: 法规标题
            content: 法规全文内容
            
        Returns:
            包含解读结果的字典
        """
        # 构建提示词
        prompt = self._build_prompt(title, content)
        
        # 调用LLM API
        response = self._call_llm_api(prompt)
        
        # 解析结果
        try:
            # 这里假设API返回的是JSON格式的字符串
            # 实际使用时根据选择的API进行修改
            analysis_result = json.loads(response)
            return analysis_result
        except json.JSONDecodeError:
            # 如果不是JSON格式，则直接返回结果
            return {
                "summary": response[:500],  # 摘要
                "key_points": [],  # 关键点
                "detailed_explanation": response,  # 详细解读
                "raw_response": response  # 原始响应
            }
    
    def _build_prompt(self, title: str, content: str) -> str:
        """构建用于法规解读的提示词
        
        Args:
            title: 法规标题
            content: 法规全文内容
            
        Returns:
            格式化的提示词
        """
        # 构建结构化提示词以获得更好的解读效果
        prompt = f"""
请以专业法律顾问的角色，对以下法规进行全面解读。
法规标题：{title}

法规内容：
{content[:8000]}  # 限制内容长度，避免超出API限制

请提供以下格式的分析：
1. 简明摘要：用200字以内概括该法规的主要内容和目的
2. 关键要点：列出5-10个该法规的关键规定和重点内容
3. 适用对象：明确说明该法规适用的主体对象
4. 主要影响：分析该法规对相关主体可能产生的主要影响
5. 实施指南：提供遵守该法规的实用建议和注意事项
6. 与其他法规的关系：简述该法规与其他相关法规的关系

请以JSON格式返回结果，包含以下字段：
{{
  "summary": "简明摘要",
  "key_points": ["关键点1", "关键点2", ...],
  "applicable_subjects": ["适用对象1", "适用对象2", ...],
  "main_impacts": ["影响1", "影响2", ...],
  "implementation_guide": ["建议1", "建议2", ...],
  "related_regulations": ["相关法规1", "相关法规2", ...]
}}
"""
        return prompt
    
    def _call_llm_api(self, prompt: str) -> str:
        """调用LLM API
        
        Args:
            prompt: 提示词
            
        Returns:
            API响应结果
        """
        model = os.environ.get("LLM_MODEL")
        # 以OpenAI API为例构建请求
        payload = {
            "model": model,  # 或其他适合的模型
            "messages": [
                {"role": "system", "content": "你是一位专业的法律顾问，擅长解读中国法律法规，尤其是人力资源和社会保障领域的政策。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,  # 降低随机性
            "max_tokens": 2000   # 控制响应长度
        }
        
        try:
            response = requests.post(
                self.api_endpoint,
                headers=self.headers,
                json=payload,
                timeout=60  # 设置较长的超时时间
            )
            
            response.raise_for_status()
            result = response.json()
            
            # 根据实际API响应结构提取内容
            # 这里以OpenAI API为例
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            return content
            
        except requests.exceptions.RequestException as e:
            print(f"调用LLM API失败: {e}")
            return f"API调用失败: {str(e)}" 