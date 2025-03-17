import os
import requests
import json
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class LLMService:
    """LLM服务集成类"""
    
    def __init__(self):
        # 默认使用OpenAI，也可以配置使用其他LLM服务
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.api_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
        self.model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    
    def generate_regulation_interpretation(self, regulation_text, title=None):
        """生成法规解读"""
        if not self.api_key:
            return "错误：未配置API密钥。请在.env文件中设置OPENAI_API_KEY。"
        
        # 构建提示词
        prompt = self._build_interpretation_prompt(regulation_text, title)
        
        try:
            # 调用OpenAI API
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "你是一位专业的劳动法规分析师，擅长解读和分析劳动法规文件，并将其转化为通俗易懂的解释。"},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 2000
            }
            
            response = requests.post(
                f"{self.api_base}/chat/completions",
                headers=headers,
                json=data
            )
            response.raise_for_status()
            
            result = response.json()
            interpretation = result["choices"][0]["message"]["content"]
            return interpretation
        
        except Exception as e:
            return f"生成解读时出错: {str(e)}"
    
    def _build_interpretation_prompt(self, regulation_text, title=None):
        """构建法规解读的提示词"""
        title_text = f"《{title}》" if title else "该法规"
        
        prompt = f"""
请对以下劳动法规进行详细解读，包括以下方面：

1. {title_text}的主要目的和适用范围
2. 核心条款解析及其实际意义
3. 对企业和员工的影响及注意事项
4. 与其他相关法规的关系（如有）
5. 实施要点和合规建议

请用通俗易懂的语言进行解释，使非法律专业人士也能理解。

法规内容：
{regulation_text}
"""
        return prompt 