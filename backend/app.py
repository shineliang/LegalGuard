from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import json
from datetime import datetime

# 添加项目根目录到系统路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入自定义模块
from database.db_operations import DBOperations
from backend.llm_integration import LLMService
from backend.routes.regulation_analysis import regulation_analysis_bp

# 初始化应用
app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 注册蓝图
app.register_blueprint(regulation_analysis_bp)

# 初始化数据库和LLM服务
db = DBOperations()
llm_service = LLMService()

@app.route('/api/regulations', methods=['GET'])
def get_regulations():
    """获取法规列表，支持搜索和分页"""
    try:
        # 获取查询参数
        search_term = request.args.get('search', None)
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        # 从数据库获取数据
        regulations = db.get_regulations(
            limit=limit,
            offset=offset,
            search_term=search_term,
            start_date=start_date,
            end_date=end_date
        )
        
        # 计算总数
        total = len(db.get_regulations(
            search_term=search_term,
            start_date=start_date,
            end_date=end_date
        ))
        
        return jsonify({
            'regulations': regulations,
            'total': total,
            'limit': limit,
            'offset': offset
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/regulations/<int:regulation_id>', methods=['GET'])
def get_regulation_detail(regulation_id):
    """获取法规详情"""
    try:
        regulation = db.get_regulation_by_id(regulation_id)
        if not regulation:
            return jsonify({'error': '法规不存在'}), 404
        
        # 获取该法规的解读
        interpretations = db.get_interpretations(regulation_id)
        
        return jsonify({
            'regulation': regulation,
            'interpretations': interpretations
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/regulations/<int:regulation_id>/interpret', methods=['POST'])
def interpret_regulation(regulation_id):
    """解读法规"""
    try:
        regulation = db.get_regulation_by_id(regulation_id)
        if not regulation:
            return jsonify({'error': '法规不存在'}), 404
        
        # 生成解读
        interpretation = llm_service.generate_regulation_interpretation(
            regulation['content'],
            regulation['title']
        )
        
        # 保存解读到数据库
        interpretation_id = db.save_interpretation(regulation_id, interpretation)
        
        return jsonify({
            'interpretation': interpretation,
            'interpretation_id': interpretation_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/timeline', methods=['GET'])
def get_regulations_timeline():
    """获取法规时间轴"""
    try:
        limit = int(request.args.get('limit', 20))
        regulations = db.get_regulations_timeline(limit=limit)
        
        return jsonify({'regulations': regulations})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/crawler/run', methods=['POST'])
def run_crawler():
    """运行爬虫（仅用于演示，实际应用中可能需要身份验证和后台任务）"""
    try:
        from backend.scrapers.mohrss_scraper import MohrssRegulationScraper
        
        # 获取要爬取的页数
        data = request.get_json()
        pages = data.get('pages', 1) if data else 1
        
        # 运行爬虫
        scraper = MohrssRegulationScraper()
        count = scraper.scrape_regulations(pages=pages)
        
        return jsonify({
            'success': True,
            'message': f'成功爬取 {count} 条法规'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 