import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime
import os
import sys
import time

# 添加项目根目录到系统路径，使我们可以导入数据库模块
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from database.db_operations import DBOperations

class MohrssRegulationScraper:
    """人力资源和社会保障部法规爬虫"""
    
    def __init__(self):
        self.base_url = "https://www.mohrss.gov.cn"
        # 爬取地址列表，包括原有的法律（fl）和新增的规范性文件（fg）
        self.list_urls = [
            "https://www.mohrss.gov.cn/xxgk2020/fdzdgknr/zcfg/fl/index_more.html",  # 法律
            "https://www.mohrss.gov.cn/xxgk2020/fdzdgknr/zcfg/fg/index_more.html"   # 规范性文件
        ]
        self.db = DBOperations()
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        # 用于全局跟踪已处理URL，避免重复处理
        self.processed_urls = set()
    
    def get_page_content(self, url):
        """获取页面内容"""
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            response.encoding = 'utf-8'
            return response.text
        except Exception as e:
            print(f"获取页面内容失败: {url}, 错误: {e}")
            return None
    
    def normalize_url(self, url, base_list_url):
        """规范化URL
        
        Args:
            url: 需要规范化的URL
            base_list_url: 当前处理的基础列表URL，用于处理相对路径
        """
        if url.startswith('./'):
            # 处理以./开头的URL
            # 获取base_url的目录部分
            base_dir = '/'.join(base_list_url.split('/')[:-1]) + '/'
            return base_dir + url[2:]  # 去掉开头的 './'
        elif url.startswith('/'):
            # 处理以/开头的URL
            return self.base_url + url
        elif not url.startswith(('http://', 'https://')):
            # 处理其他相对URL
            return self.base_url + '/' + url
        return url  # 已经是绝对URL
    
    def parse_regulation_list(self, html_content, base_list_url):
        """解析法规列表页面
        
        Args:
            html_content: 页面HTML内容
            base_list_url: 当前处理的基础列表URL，用于处理相对路径
        """
        if not html_content:
            return []
        
        soup = BeautifulSoup(html_content, 'html.parser')
        regulations = []
        
        # 查找列表中的法规项目
        list_container = soup.select_one('.list-box')
        if not list_container:
            list_container = soup.select_one('.list')
        
        if not list_container:
            print("找不到法规列表容器，尝试使用通用选择器")
            list_items = soup.select('ul li a[href*="/t"]')
        else:
            list_items = list_container.select('ul li')
        
        # 如果没有找到项目，尝试不同的选择器
        if not list_items:
            list_items = soup.select('a[href*="/t202"]')
        
        for item in list_items:
            try:
                if item.name == 'li':
                    link_tag = item.find('a')
                    date_tag = item.find('span')
                    
                    if link_tag:
                        title = link_tag.get_text(strip=True)
                        relative_url = link_tag.get('href')
                        if relative_url:
                            url = self.normalize_url(relative_url, base_list_url)
                            publish_date = date_tag.get_text(strip=True) if date_tag else ''
                            
                            # 格式化日期
                            try:
                                # 尝试解析常见的日期格式 (YYYY-MM-DD)
                                publish_date = datetime.strptime(publish_date, '%Y-%m-%d').strftime('%Y-%m-%d')
                            except ValueError:
                                # 如果解析失败，保留原始字符串
                                pass
                            
                            regulations.append({
                                'title': title,
                                'url': url,
                                'publish_date': publish_date
                            })
                elif item.name == 'a':
                    # 直接处理a标签
                    title = item.get_text(strip=True)
                    relative_url = item.get('href')
                    if relative_url:
                        url = self.normalize_url(relative_url, base_list_url)
                        # 可能没有日期信息
                        regulations.append({
                            'title': title,
                            'url': url,
                            'publish_date': ''
                        })
            except Exception as e:
                print(f"解析法规项目失败: {e}")
                continue
        
        print(f"从页面解析出 {len(regulations)} 条法规")
        return regulations
    
    def parse_regulation_detail(self, url, regulation_meta):
        """解析法规详情页面"""
        html_content = self.get_page_content(url)
        if not html_content:
            return None
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        try:
            # 尝试获取正文内容区域
            content_div = soup.select_one('.TRS_Editor, .content, .article, #Zoom, .xxgk_detail_content, .weinei')
            
            if not content_div:
                # 如果没有找到指定的类，尝试使用更通用的选择器
                content_div = soup.select_one('div[class*="content"], div[class*="article"], div[class*="detail"]')
            
            if content_div:
                # 移除脚本和样式
                for script in content_div(["script", "style"]):
                    script.decompose()
                
                # 格式化内容，保留段落结构
                paragraphs = []
                for p in content_div.find_all(['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5']):
                    text = p.get_text(strip=True)
                    if text:
                        paragraphs.append(text)
                
                content = '\n\n'.join(paragraphs)
                
                # 如果无法通过段落提取，使用完整文本
                if not content:
                    content = content_div.get_text('\n', strip=True)
            else:
                # 最后的尝试：获取网页的主体部分
                content = soup.body.get_text('\n', strip=True) if soup.body else "无法提取内容"
            
            # 尝试提取有效日期和来源信息
            effective_date = None
            implementation_date = None
            source = "人力资源和社会保障部"
            
            # 从元数据中提取发布日期
            publish_date = None
            
            # 1. 首先尝试从页面元数据中提取发文日期（发布日期）
            # 改进元数据选择器，增加更多可能的元数据容器选择
            metadata_list = soup.select('.xxgk-info-head li, .xxgk_detail_head li, .metadata li, .info-source li, .xxgk-detail-source li')
            
            # 如果上述选择器没找到元素，尝试更通用的方式
            if not metadata_list:
                # 查找所有可能包含"发文日期"、"发布日期"的列表项
                metadata_list = soup.select('li')
            
            # 记录调试信息
            print(f"找到 {len(metadata_list)} 个元数据项")
            
            for item in metadata_list:
                text = item.get_text(strip=True)
                # 打印调试信息
                print(f"元数据项: {text}")
                
                # 检查是否包含发文日期相关信息
                if '发文日期' in text or '发布日期' in text or '发布时间' in text:
                    # 尝试不同的日期格式匹配
                    # 1. 年月日格式（如：2023年08月16日）
                    date_match = re.search(r'(\d{4}年\d{1,2}月\d{1,2}日)', text)
                    if date_match:
                        try:
                            publish_date = datetime.strptime(date_match.group(1), '%Y年%m月%d日').strftime('%Y-%m-%d')
                            print(f"从元数据中提取到发文日期: {publish_date}")
                            break
                        except ValueError:
                            pass
                    
                    # 2. 年-月-日格式（如：2023-08-16）
                    date_match = re.search(r'(\d{4}-\d{1,2}-\d{1,2})', text)
                    if date_match:
                        try:
                            publish_date = date_match.group(1)
                            # 确保日期格式统一
                            publish_date = datetime.strptime(publish_date, '%Y-%m-%d').strftime('%Y-%m-%d')
                            print(f"从元数据中提取到发文日期: {publish_date}")
                            break
                        except ValueError:
                            pass
                    
                    # 3. 纯数字格式（如：20230816）
                    date_match = re.search(r'(\d{8})', text)
                    if date_match:
                        try:
                            date_str = date_match.group(1)
                            publish_date = datetime.strptime(date_str, '%Y%m%d').strftime('%Y-%m-%d')
                            print(f"从元数据中提取到发文日期: {publish_date}")
                            break
                        except ValueError:
                            pass
                    
                    # 如果未通过正则匹配到日期，尝试提取"发文日期"后面的文本
                    if not publish_date:
                        date_part = text.split('发文日期')[-1].strip()
                        if date_part and len(date_part) <= 15:  # 限制长度避免提取过多无关文本
                            print(f"尝试解析日期文本: {date_part}")
                            # 尝试多种日期格式
                            for fmt in ['%Y年%m月%d日', '%Y-%m-%d', '%Y/%m/%d', '%Y.%m.%d']:
                                try:
                                    publish_date = datetime.strptime(date_part, fmt).strftime('%Y-%m-%d')
                                    print(f"成功解析发文日期: {publish_date}")
                                    break
                                except ValueError:
                                    continue
                        if publish_date:
                            break
            
            # 2. 如果元数据中没有找到，使用regulation_meta中的日期
            if not publish_date:
                publish_date = regulation_meta.get('publish_date', '')
                if publish_date:
                    print(f"使用列表页中的发布日期: {publish_date}")
            
            # 3. 如果仍然没有找到，尝试从URL中提取
            if not publish_date:
                date_match_url = re.search(r'/t(\d{8})_', url)
                if date_match_url:
                    try:
                        date_str = date_match_url.group(1)
                        publish_date = datetime.strptime(date_str, '%Y%m%d').strftime('%Y-%m-%d')
                        print(f"从URL中提取到发布日期: {publish_date}")
                    except ValueError:
                        pass
            
            # 查找有效日期（施行日期）
            implementation_pattern = r'自(\d{4}年\d{1,2}月\d{1,2}日)起施行|自(\d{4}年\d{1,2}月\d{1,2}日)生效'
            implementation_match = re.search(implementation_pattern, content)
            if implementation_match:
                date_str = implementation_match.group(1) or implementation_match.group(2)
                try:
                    implementation_date = datetime.strptime(date_str, '%Y年%m月%d日').strftime('%Y-%m-%d')
                    print(f"提取到施行日期: {implementation_date}")
                except ValueError:
                    implementation_date = None
            
            # 区分有效日期和施行日期
            if implementation_date and not effective_date:
                effective_date = implementation_date
            
            # 打印调试信息
            print(f"最终解析结果 - 发布日期: {publish_date}, 施行日期: {implementation_date}")
            
            return {
                'title': regulation_meta['title'],
                'publish_date': publish_date,
                'url': url,
                'content': content,
                'effective_date': effective_date,
                'implementation_date': implementation_date,  # 新增施行日期字段
                'source': source,
                'category': '法律法规'
            }
        
        except Exception as e:
            print(f"解析法规详情失败: {url}, 错误: {e}")
            return None
    
    def find_pagination_links(self, html_content, base_list_url):
        """查找分页链接
        
        Args:
            html_content: 页面HTML内容
            base_list_url: 当前处理的基础列表URL，用于处理相对路径
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        pagination_links = []
        
        # 尝试寻找分页区域
        pagination = soup.select_one('.page, .pagination, .paging')
        if pagination:
            # 查找页面链接
            for a in pagination.find_all('a', href=True):
                href = a.get('href')
                if href and 'index_more' in href:
                    absolute_url = self.normalize_url(href, base_list_url)
                    pagination_links.append(absolute_url)
        
        return pagination_links
    
    def load_existing_urls(self):
        """从数据库中加载所有已存在的URL"""
        # 获取所有法规记录
        all_regulations = self.db.get_regulations(limit=1000)  # 设置一个较大的限制以获取所有记录
        # 提取并存储所有URL
        existing_urls = set()
        for reg in all_regulations:
            if 'url' in reg and reg['url']:
                existing_urls.add(reg['url'].strip())
        return existing_urls
    
    def scrape_regulations(self, pages=1):
        """爬取法规信息"""
        saved_count = 0
        
        # 预先加载所有已存在的URL，避免重复爬取
        existing_urls = self.load_existing_urls()
        print(f"数据库中已有 {len(existing_urls)} 条法规记录")
        
        # 遍历所有爬取地址
        for list_url in self.list_urls:
            print(f"\n=== 开始爬取网址: {list_url} ===")
            
            # 首先获取主页面内容
            html_content = self.get_page_content(list_url)
            if not html_content:
                print(f"无法获取页面内容: {list_url}")
                continue
            
            # 解析主页面的法规列表
            regulations = self.parse_regulation_list(html_content, list_url)
            
            # 如果需要爬取更多页，尝试查找分页链接
            if pages > 1:
                pagination_links = self.find_pagination_links(html_content, list_url)
                print(f"找到 {len(pagination_links)} 个分页链接")
                
                # 爬取分页内容
                for i, page_url in enumerate(pagination_links[:pages-1], 2):
                    if page_url in self.processed_urls:
                        continue
                    
                    self.processed_urls.add(page_url)
                    print(f"正在爬取第 {i} 页: {page_url}")
                    
                    page_html = self.get_page_content(page_url)
                    if page_html:
                        page_regulations = self.parse_regulation_list(page_html, list_url)
                        regulations.extend(page_regulations)
                    
                    # 页面之间的延迟
                    time.sleep(3)
            
            print(f"共找到 {len(regulations)} 条法规")
            
            # 处理每条法规详情
            for reg in regulations:
                try:
                    url = reg['url'].strip()
                    title = reg['title'].strip()
                    
                    # 跳过已处理的URL
                    if url in self.processed_urls:
                        print(f"URL已处理，跳过: {url}")
                        continue
                    
                    # 标记URL为已处理
                    self.processed_urls.add(url)
                    
                    # 检查数据库中是否已存在同样URL的法规
                    if url in existing_urls:
                        print(f"法规已存在于数据库中: {title}")
                        continue
                    
                    print(f"正在爬取法规详情: {title} - {url}")
                    detail = self.parse_regulation_detail(url, reg)
                    
                    if detail:
                        self.db.save_regulation(
                            title=detail['title'],
                            publish_date=detail['publish_date'],
                            source=detail['source'],
                            content=detail['content'],
                            url=detail['url'],
                            effective_date=detail.get('effective_date'),
                            implementation_date=detail.get('implementation_date'),
                            category=detail.get('category')
                        )
                        # 添加到已存在URL集合，避免后续重复添加
                        existing_urls.add(url)
                        saved_count += 1
                        print(f"成功保存法规: {detail['title']}")
                    
                    # 添加延迟以避免请求过于频繁
                    time.sleep(2)
                
                except Exception as e:
                    print(f"处理法规时出错: {reg['title']}, 错误: {e}")
                    continue
        
        return saved_count

    def update_existing_regulations(self):
        """更新现有法规的元数据（特别是发文日期和施行日期）"""
        # 获取所有法规记录
        all_regulations = self.db.get_regulations(limit=1000)
        total_count = len(all_regulations)
        updated_count = 0
        
        print(f"开始更新 {total_count} 条法规记录的元数据")
        
        for i, reg in enumerate(all_regulations, 1):
            reg_id = reg['id']
            title = reg['title']
            url = reg.get('url', '')
            
            if not url:
                print(f"跳过 ID={reg_id} - {title}：没有URL")
                continue
            
            print(f"\n[{i}/{total_count}] 更新：{title}")
            
            # 创建metadata对象，用于传递给parse_regulation_detail
            reg_meta = {
                'title': title,
                'url': url,
                'publish_date': reg.get('publish_date', '')
            }
            
            # 重新解析详情页
            detail = self.parse_regulation_detail(url, reg_meta)
            
            if not detail:
                print(f"跳过 ID={reg_id} - {title}：无法解析详情")
                continue
            
            # 检查是否需要更新
            need_update = False
            update_fields = {}
            
            # 检查发布日期
            if detail.get('publish_date') and detail['publish_date'] != reg.get('publish_date'):
                update_fields['publish_date'] = detail['publish_date']
                need_update = True
                print(f"  - 发布日期：{reg.get('publish_date', '空')} -> {detail['publish_date']}")
            
            # 检查施行日期
            if detail.get('implementation_date') and detail.get('implementation_date') != reg.get('implementation_date'):
                update_fields['implementation_date'] = detail['implementation_date']
                need_update = True
                print(f"  - 施行日期：{reg.get('implementation_date', '空')} -> {detail['implementation_date']}")
            
            # 检查有效日期
            if detail.get('effective_date') and detail.get('effective_date') != reg.get('effective_date'):
                update_fields['effective_date'] = detail['effective_date']
                need_update = True
                print(f"  - 有效日期：{reg.get('effective_date', '空')} -> {detail['effective_date']}")
            
            # 如果需要更新，调用数据库更新操作
            if need_update:
                try:
                    self.db.update_regulation(reg_id, update_fields)
                    updated_count += 1
                    print(f"  ✅ 成功更新 ID={reg_id} - {title}")
                except Exception as e:
                    print(f"  ❌ 更新失败 ID={reg_id} - {title}：{e}")
            else:
                print(f"  ✓ 无需更新 ID={reg_id} - {title}")
            
            # 添加延迟以避免请求过于频繁
            time.sleep(1)
        
        print(f"\n更新完成！共更新 {updated_count}/{total_count} 条法规记录")
        return updated_count

if __name__ == "__main__":
    # 运行爬虫
    scraper = MohrssRegulationScraper()
    
    # 解析命令行参数
    import sys
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "test_date":
            # 测试发文日期解析
            test_url = "https://www.mohrss.gov.cn/xxgk2020/fdzdgknr/zcfg/fg/202312/t20231201_509829.html"
            print(f"\n=== 测试发文日期解析: {test_url} ===")
            
            # 创建一个简单的regulation_meta对象
            mock_meta = {
                'title': '社会保险经办条例',
                'url': test_url,
                'publish_date': ''
            }
            
            # 解析详情
            detail = scraper.parse_regulation_detail(test_url, mock_meta)
            if detail:
                print("\n解析结果:")
                print(f"标题: {detail['title']}")
                print(f"发布日期: {detail['publish_date']}")
                print(f"施行日期: {detail.get('implementation_date')}")
                print(f"有效日期: {detail.get('effective_date')}")
                
                if detail['publish_date'] == '2023-08-16':
                    print("\n✅ 测试通过！成功解析出正确的发文日期")
                else:
                    print(f"\n❌ 测试未通过！解析出的发文日期不正确: {detail['publish_date']}")
        
        elif command == "update":
            # 更新现有法规的元数据
            scraper.update_existing_regulations()
    
    else:
        # 正常模式：运行爬虫
        count = scraper.scrape_regulations(pages=1)
        print(f"共保存 {count} 条法规信息") 