import os
import sys
import time
from mohrss_scraper import MohrssRegulationScraper

# 添加项目根目录到系统路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database.init_db import init_db

def main():
    """运行所有爬虫"""
    # 初始化数据库
    print("正在初始化数据库...")
    init_db()
    
    # 运行人力资源社会保障部爬虫
    print("\n=== 开始爬取人力资源和社会保障部法规 ===")
    mohrss_scraper = MohrssRegulationScraper()
    count = mohrss_scraper.scrape_regulations(pages=1)
    print(f"成功爬取 {count} 条人力资源和社会保障部法规")
    
    # 在这里可以添加更多爬虫
    
    print("\n所有爬虫任务完成！")

if __name__ == "__main__":
    main() 