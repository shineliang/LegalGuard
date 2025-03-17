import sqlite3
from datetime import datetime
import json

class DBOperations:
    def __init__(self, db_path='database/legalguard.db'):
        self.db_path = db_path
        self._ensure_analysis_table_exists()

    def _ensure_analysis_table_exists(self):
        """确保法规解读表存在"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS regulation_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                regulation_id INTEGER NOT NULL,
                summary TEXT,
                analysis_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (regulation_id) REFERENCES regulations (id)
            )
        ''')
        
        conn.commit()
        conn.close()

    def get_connection(self):
        """获取数据库连接"""
        return sqlite3.connect(self.db_path)

    def save_regulation(self, title, publish_date, source, content, url, effective_date=None, category=None):
        """保存法规信息到数据库"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                """
                INSERT INTO regulations (title, publish_date, effective_date, source, content, url, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (title, publish_date, effective_date, source, content, url, category)
            )
            regulation_id = cursor.lastrowid
            conn.commit()
            return regulation_id
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    def get_regulations(self, limit=100, offset=0, search_term=None, start_date=None, end_date=None):
        """获取法规列表，支持搜索和日期筛选"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM regulations"
        params = []
        where_clauses = []
        
        if search_term:
            where_clauses.append("(title LIKE ? OR content LIKE ?)")
            search_pattern = f"%{search_term}%"
            params.extend([search_pattern, search_pattern])
        
        if start_date:
            where_clauses.append("publish_date >= ?")
            params.append(start_date)
        
        if end_date:
            where_clauses.append("publish_date <= ?")
            params.append(end_date)
        
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
        
        query += " ORDER BY publish_date DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        regulations = cursor.fetchall()
        
        # 将结果转换为字典列表
        column_names = [col[0] for col in cursor.description]
        result = [dict(zip(column_names, row)) for row in regulations]
        
        conn.close()
        return result

    def get_regulation_by_id(self, regulation_id):
        """根据ID获取法规详情"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM regulations WHERE id = ?", (regulation_id,))
        regulation = cursor.fetchone()
        
        if regulation:
            column_names = [col[0] for col in cursor.description]
            result = dict(zip(column_names, regulation))
        else:
            result = None
        
        conn.close()
        return result

    def save_interpretation(self, regulation_id, interpretation):
        """保存法规解读"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                """
                INSERT INTO interpretations (regulation_id, interpretation)
                VALUES (?, ?)
                """,
                (regulation_id, interpretation)
            )
            interpretation_id = cursor.lastrowid
            conn.commit()
            return interpretation_id
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    def get_interpretations(self, regulation_id):
        """获取法规解读列表"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM interpretations WHERE regulation_id = ?", (regulation_id,))
        interpretations = cursor.fetchall()
        
        column_names = [col[0] for col in cursor.description]
        result = [dict(zip(column_names, row)) for row in interpretations]
        
        conn.close()
        return result

    def get_regulations_timeline(self, limit=20):
        """获取法规时间轴数据"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            SELECT id, title, publish_date, source, category
            FROM regulations
            ORDER BY publish_date DESC
            LIMIT ?
            """,
            (limit,)
        )
        regulations = cursor.fetchall()
        
        column_names = [col[0] for col in cursor.description]
        result = [dict(zip(column_names, row)) for row in regulations]
        
        conn.close()
        return result

    def save_regulation_analysis(self, regulation_id, analysis_data):
        """保存法规解读结果
        
        Args:
            regulation_id: 法规ID
            analysis_data: 解读结果字典
            
        Returns:
            解读记录ID
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 转换为JSON字符串存储
        analysis_json = json.dumps(analysis_data, ensure_ascii=False)
        
        # 提取摘要，方便查询
        summary = analysis_data.get('summary', '')
        
        try:
            cursor.execute(
                """
                INSERT INTO regulation_analysis (regulation_id, summary, analysis_data, created_at, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                (regulation_id, summary, analysis_json)
            )
            analysis_id = cursor.lastrowid
            conn.commit()
            return analysis_id
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def update_regulation_analysis(self, regulation_id, analysis_data):
        """更新法规解读结果
        
        Args:
            regulation_id: 法规ID
            analysis_data: 新的解读结果字典
            
        Returns:
            是否更新成功
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 转换为JSON字符串存储
        analysis_json = json.dumps(analysis_data, ensure_ascii=False)
        
        # 提取摘要，方便查询
        summary = analysis_data.get('summary', '')
        
        try:
            cursor.execute(
                """
                UPDATE regulation_analysis
                SET summary = ?, analysis_data = ?, updated_at = CURRENT_TIMESTAMP
                WHERE regulation_id = ?
                """,
                (summary, analysis_json, regulation_id)
            )
            success = cursor.rowcount > 0
            conn.commit()
            return success
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def get_regulation_analysis(self, regulation_id):
        """获取法规解读结果
        
        Args:
            regulation_id: 法规ID
            
        Returns:
            解读结果字典或None
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            SELECT id, regulation_id, summary, analysis_data, created_at, updated_at
            FROM regulation_analysis
            WHERE regulation_id = ?
            """,
            (regulation_id,)
        )
        
        record = cursor.fetchone()
        conn.close()
        
        if not record:
            return None
        
        column_names = [col[0] for col in cursor.description]
        result = dict(zip(column_names, record))
        
        # 解析JSON数据
        try:
            analysis_data = json.loads(result['analysis_data'])
            # 添加元数据
            analysis_data['analysis_id'] = result['id']
            analysis_data['created_at'] = result['created_at']
            analysis_data['updated_at'] = result['updated_at']
            return analysis_data
        except json.JSONDecodeError:
            return {
                'analysis_id': result['id'],
                'summary': result['summary'],
                'error': '解析解读数据失败',
                'created_at': result['created_at'],
                'updated_at': result['updated_at']
            } 