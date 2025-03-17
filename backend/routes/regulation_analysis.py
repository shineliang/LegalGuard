from flask import Blueprint, request, jsonify
import os
import sys

# 添加项目根目录到系统路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database.db_operations import DBOperations
from backend.llm.regulation_analyzer import RegulationAnalyzer

# 创建蓝图
regulation_analysis_bp = Blueprint('regulation_analysis', __name__)
db = DBOperations()

@regulation_analysis_bp.route('/api/regulation/analyze/<int:regulation_id>', methods=['GET'])
def analyze_regulation(regulation_id):
    """获取法规解读
    
    Args:
        regulation_id: 法规ID
        
    Returns:
        法规解读结果
    """
    try:
        # 从数据库获取法规
        regulation = db.get_regulation_by_id(regulation_id)
        if not regulation:
            return jsonify({"error": "法规不存在"}), 404
        
        # 检查是否已有解读结果缓存
        analysis_result = db.get_regulation_analysis(regulation_id)
        if analysis_result:
            return jsonify(analysis_result), 200
        
        # 调用LLM解读法规
        analyzer = RegulationAnalyzer()
        analysis = analyzer.analyze_regulation(
            title=regulation["title"],
            content=regulation["content"]
        )
        
        # 保存解读结果到数据库
        db.save_regulation_analysis(regulation_id, analysis)
        
        return jsonify(analysis), 200
    
    except Exception as e:
        return jsonify({"error": f"分析法规失败: {str(e)}"}), 500

@regulation_analysis_bp.route('/api/regulation/analyze/refresh/<int:regulation_id>', methods=['POST'])
def refresh_analysis(regulation_id):
    """刷新法规解读
    
    Args:
        regulation_id: 法规ID
        
    Returns:
        更新后的法规解读结果
    """
    try:
        # 从数据库获取法规
        regulation = db.get_regulation_by_id(regulation_id)
        if not regulation:
            return jsonify({"error": "法规不存在"}), 404
        
        # 调用LLM解读法规
        analyzer = RegulationAnalyzer()
        analysis = analyzer.analyze_regulation(
            title=regulation["title"],
            content=regulation["content"]
        )
        
        # 更新数据库中的解读结果
        db.update_regulation_analysis(regulation_id, analysis)
        
        return jsonify(analysis), 200
    
    except Exception as e:
        return jsonify({"error": f"刷新法规解读失败: {str(e)}"}), 500 