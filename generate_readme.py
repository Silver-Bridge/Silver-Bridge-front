import os
import re
import json
from datetime import datetime

# ==============================================================================
# 설정 및 템플릿
# ==============================================================================

# 분석에서 제외할 폴더 및 파일
IGNORE_DIRS = {
    'node_modules', '.next', 'dist', 'build', 'coverage', '.git', 
    '.github', '.vscode', 'public', '.husky', '__mocks__'
}
IGNORE_FILES = {
    '.gitignore', 'generate_readme.py', 'README.md', 'package-lock.json', 
    'yarn.lock', '.eslintrc.json', 'tsconfig.json', 'pnpm-lock.yaml'
}

README_TEMPLATE = """# Silver Bridge Frontend
> 지역별 노인 맞춤형 사투리 음성인식 서비스를 제공하는 AI 기반 복지 플랫폼 **Silver Bridge**의 사용자 인터페이스(Web/App)입니다.

---

# 📚 Table of Contents
{table_of_contents}

---

# 🚀 프로젝트 개요
Silver Bridge Frontend는 고령층 사용자를 위해 **직관적인 UI/UX**와 **음성 인터페이스**를 중점으로 설계되었습니다.
보호자와 노인 사용자를 위한 맞춤형 화면을 제공하며, 백엔드 API와 실시간으로 통신합니다.

---

# 📦 기술 스택 (Auto-detected)
{tech_stack}

---

# 📁 1. 프로젝트 구조
<pre>
{project_structure}
</pre>

---

# 📄 2. Pages & Routes Summary
> 주요 화면(Page) 구성입니다.
{pages_summary}

---

# 🧩 3. Components Summary
> 재사용 가능한 UI 컴포넌트 구조입니다.
{components_summary}

---

# 📡 4. API & Hooks Layer
> 백엔드 통신 함수 및 커스텀 훅 요약입니다.
{api_summary}

---

# 🛠 5. Installation & Run
```bash
# 의존성 설치
npm install
# or
yarn install

# 개발 서버 실행
npm run dev
# or
yarn dev
```

> **Last Updated:** {generated_at}
"""

# ==============================================================================
# 유틸리티: 경로 찾기
# ==============================================================================

def find_src_root(start_path="."):
    """src 폴더를 찾습니다."""
    print(f"🔍 [DEBUG] 소스 루트 찾는 중... (시작: {os.path.abspath(start_path)})")
    
    # 1. 표준 src 확인
    standard_path = os.path.join(start_path, "src")
    if os.path.exists(standard_path):
        return standard_path
    
    # 2. Next.js App Router 등의 경우 (app 폴더가 루트에 있을 때)
    app_path = os.path.join(start_path, "app")
    if os.path.exists(app_path):
        return start_path # 루트 자체가 소스 루트 역할

    return start_path

# ==============================================================================
# 1. 기술 스택 분석 (package.json)
# ==============================================================================

def analyze_tech_stack(root_path):
    pkg_path = os.path.join(root_path, "package.json")
    if not os.path.exists(pkg_path):
        return "package.json not found."

    summary = ""
    try:
        with open(pkg_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        dependencies = data.get('dependencies', {})
        dev_dependencies = data.get('devDependencies', {})
        
        # 주요 프레임워크/라이브러리 강조
        highlights = ['react', 'vue', 'next', 'typescript', 'axios', 'tailwindcss', 'styled-components', 'redux', 'zustand', 'recoil', 'framer-motion', 'react-router-dom']
        
        summary += "### ✨ Core Libraries\n"
        for lib in highlights:
            if lib in dependencies:
                summary += f"- **{lib}**: `{dependencies[lib]}`\n"
            elif lib in dev_dependencies:
                summary += f"- **{lib}**: `{dev_dependencies[lib]}` (dev)\n"
        
        summary += "\n### 📚 All Dependencies\n<details><summary>Click to expand</summary>\n\n"
        for name, version in dependencies.items():
            if name not in highlights:
                summary += f"- {name}: `{version}`\n"
        summary += "</details>\n"
            
    except Exception as e:
        return f"Error parsing package.json: {e}"
    
    return summary

# ==============================================================================
# 2. 프로젝트 구조 (백엔드와 동일 로직)
# ==============================================================================

def get_project_structure(path, prefix=""):
    if not os.path.exists(path):
        return ""
    tree = ""
    try:
        items = sorted(os.listdir(path))
        items = [i for i in items if i not in IGNORE_DIRS and i not in IGNORE_FILES]
        
        count = len(items)
        for index, item in enumerate(items):
            full_path = os.path.join(path, item)
            is_last = (index == count - 1)
            connector = "└── " if is_last else "├── "
            
            if os.path.isdir(full_path):
                tree += f"{prefix}{connector}📁 {item}\n"
                extension = "    " if is_last else "│   "
                tree += get_project_structure(full_path, prefix + extension)
            else:
                tree += f"{prefix}{connector}📄 {item}\n"
    except Exception:
        pass
    return tree

# ==============================================================================
# 3. Pages 분석
# ==============================================================================

def summarize_pages(src_path):
    summary = ""
    # Pages 디렉토리 후보군
    target_dirs = ['pages', 'app', 'views', 'screens']
    
    found = False
    for target in target_dirs:
        target_path = os.path.join(src_path, target)
        if os.path.exists(target_path):
            summary += f"### 📂 src/{target}\n"
            found = True
            
            for root, dirs, files in os.walk(target_path):
                level = root.replace(target_path, '').count(os.sep)
                indent = '  ' * level
                folder_name = os.path.basename(root)
                
                if level == 0: pass
                else: summary += f"- {indent}📁 **{folder_name}**\n"
                
                for file in files:
                    if file.endswith(('.jsx', '.tsx', '.vue', '.js')) and not file.startswith('_'):
                        file_name = os.path.splitext(file)[0]
                        # index.tsx 같은 경우 폴더명이 페이지명이 됨
                        if file_name == 'index' or file_name == 'page':
                            continue 
                        summary += f"- {indent}  📄 `{file_name}`\n"
            summary += "\n"
            
    if not found:
        return "No standard page directories found (pages, app, views, screens)."
    return summary

# ==============================================================================
# 4. Components 분석
# ==============================================================================

def summarize_components(src_path):
    comp_path = os.path.join(src_path, "components")
    if not os.path.exists(comp_path):
        return "No 'components' directory found."

    summary = ""
    # 컴포넌트 폴더 내의 최상위 폴더들을 그룹으로 인식 (예: common, layout, feature...)
    for item in sorted(os.listdir(comp_path)):
        full_path = os.path.join(comp_path, item)
        if os.path.isdir(full_path):
            summary += f"### 🔹 {item}\n"
            files = [f for f in os.listdir(full_path) if f.endswith(('.tsx', '.jsx', '.vue'))]
            if not files: # 하위 폴더가 또 있는 경우
                 for sub_root, _, sub_files in os.walk(full_path):
                     for sub_f in sub_files:
                         if sub_f.endswith(('.tsx', '.jsx', '.vue')):
                             summary += f"- `{sub_f.split('.')[0]}`\n"
            else:
                for f in files:
                    summary += f"- `{f.split('.')[0]}`\n"
            summary += "\n"
            
    return summary if summary else "No components detected."

# ==============================================================================
# 5. API & Hooks 분석
# ==============================================================================

def summarize_api(src_path):
    summary = ""
    # API 정의를 찾을 폴더 후보
    targets = {'api': '📡 API Clients', 'services': '📡 Services', 'hooks': '🪝 Custom Hooks', 'lib': '📚 Lib/Utils'}
    
    regex_export = re.compile(r'export\s+(?:const|function|class)\s+(\w+)')
    
    for folder, title in targets.items():
        target_path = os.path.join(src_path, folder)
        if os.path.exists(target_path):
            summary += f"### {title}\n"
            for file in os.listdir(target_path):
                if file.endswith(('.ts', '.js', '.tsx', '.jsx')):
                    summary += f"- **{file}**\n"
                    # 파일 내부 함수 읽기
                    try:
                        with open(os.path.join(target_path, file), 'r', encoding='utf-8') as f:
                            content = f.read()
                            matches = regex_export.findall(content)
                            # 너무 많으면 5개로 자르기
                            matches = matches[:5] 
                            for m in matches:
                                summary += f"  - `{m}`\n"
                    except: pass
            summary += "\n"
            
    return summary if summary else "No API or Hooks directories found."

# ==============================================================================
# 메인 실행
# ==============================================================================

def build_table_of_contents():
    return """
1. [프로젝트 구조](#-1-프로젝트-구조)
2. [Pages & Routes](#-2-pages--routes-summary)
3. [Components](#-3-components-summary)
4. [API & Hooks](#-4-api--hooks-layer)
5. [Installation](#-5-installation--run)
"""

def main():
    root = "."
    src_path = find_src_root(root)
    
    print(f"🚀 프론트엔드 분석 시작 (src 경로: {src_path})")
    
    tech_stack = analyze_tech_stack(root)
    structure = get_project_structure(root)
    pages = summarize_pages(src_path)
    components = summarize_components(src_path)
    api = summarize_api(src_path)
    toc = build_table_of_contents()
    
    readme = README_TEMPLATE.format(
        table_of_contents=toc,
        tech_stack=tech_stack,
        project_structure=structure,
        pages_summary=pages,
        components_summary=components,
        api_summary=api,
        generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    
    with open("README.md", "w", encoding="utf-8") as f:
        f.write(readme)
        
    print("✅ Frontend README.md 자동 생성 완료!")

if __name__ == "__main__":
    main()
