import sqlite3
import os

def init_db():
    """初始化数据库结构"""
    # 确保数据库目录存在
    os.makedirs('database', exist_ok=True)
    
    # 连接到SQLite数据库（如果不存在则创建）
    conn = sqlite3.connect('database/legalguard.db')
    cursor = conn.cursor()
    
    # 读取并执行SQL脚本
    with open('database/schema.sql', 'r') as f:
        schema_sql = f.read()
        cursor.executescript(schema_sql)
    
    conn.commit()
    conn.close()
    print("数据库初始化完成")

if __name__ == "__main__":
    init_db() 