import os
import re
import json
from datetime import datetime

# ==============================================================================
# 설정 및 템플릿
# ==============================================================================

# 분석 및 트리 출력에서 제외할 항목
IGNORE_DIRS = {
    'node_modules', '.expo', '.git', '.github', '.idea', '__pycache__', 
    'assets', 'build', 'dist', '.vscode'
}
IGNORE_FILES = {
    '.gitignore', 'generate_readme.py', 'README.md', 'package-lock.json', 
    'yarn.lock', 'babel.config.js', 'metro.config.js', 'app.json', 
    'App.js', 'index.js', 'global.css', '.DS_Store'
}
# 이미지 파일 확장자 제외 (트리가 너무 길어지는 것 방지)
IGNORE_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg'}

README_TEMPLATE = """# Silver Bridge Mobile App
> 지역별 노인 맞춤형 사투리 음성인식 서비스를 제공하는 AI 기반 복지 플랫폼 **Silver Bridge**의 모바일 애플리케이션입니다.

---

# 📚 Table of Contents
{table_of_contents}

---

# 📱 프로젝트 개요
Silver Bridge App은 React Native(Expo)로 개발되었으며, **직관적인 터치 인터페이스**와 **음성 대화 기능**을 통해 고령층 사용자가 쉽게 사용할 수 있도록 설계되었습니다.

---

# 📦 기술 스택
{tech_stack}

---

# 📁 1. 프로젝트 구조
<pre>
{project_structure}
</pre>

---

# 🗺️ 2. Navigation & Screens
> 앱의 네비게이션 구조와 주요 화면 구성입니다.
{screens_summary}

---

# 📡 3. API & Data Layer
> 백엔드 통신(Axios) 및 데이터 처리 로직입니다.
{api_summary}

---

# 🧩 4. Components & Shared Utils
> 재사용 가능한 UI 컴포넌트 및 유틸리티입니다.
{components_summary}

---

# 🚀 5. Installation & Run
```bash
cd mobile

# 의존성 설치
npm install

# Expo 앱 실행
npx expo start
```

> **Last Updated:** {generated_at}
"""

# ==============================================================================
# 유틸리티: 경로 찾기
# ==============================================================================

def find_mobile_root(start_path="."):
    """mobile 폴더 또는 src 폴더의 위치를 찾습니다."""
    print(f"🔍 [DEBUG] 모바일 소스 루트 찾는 중... (시작: {os.path.abspath(start_path)})")
    
    # 1. mobile 폴더 우선 탐색 (사용자 구조)
    mobile_path = os.path.join(start_path, "mobile")
    if os.path.exists(mobile_path):
        print(f"✅ [DEBUG] 'mobile' 폴더 발견: {mobile_path}")
        return mobile_path
        
    return start_path

# ==============================================================================
# 1. 기술 스택 분석 (package.json)
# ==============================================================================

def analyze_tech_stack(root_path):
    # mobile 폴더 안에 package.json이 있는지 확인
    pkg_path = os.path.join(root_path, "package.json")
    if not os.path.exists(pkg_path):
        return "package.json not found."

    summary = ""
    try:
        with open(pkg_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        deps = data.get('dependencies', {})
        
        # React Native / Expo 주요 라이브러리
        highlights = [
            'react', 'react-native', 'expo', 'expo-router', '@react-navigation/native', 
            'axios', 'react-query', '@tanstack/react-query', 'zustand', 'recoil', 
            'nativewind', 'tailwindcss', 'lottie-react-native'
        ]
        
        summary += "### ✨ Core Libraries\n"
        for lib in highlights:
            # 부분 일치 검색 (예: @react-navigation/stack 등)
            matched = [k for k in deps.keys() if lib in k]
            for m in matched:
                summary += f"- **{m}**: `{deps[m]}`\n"
            
        summary += "\n### 📚 Dependencies Summary\n"
        summary += f"- Total Dependencies: {len(deps)}개\n"
            
    except Exception as e:
        return f"Error parsing package.json: {e}"
    
    return summary

# ==============================================================================
# 2. 프로젝트 구조
# ==============================================================================

def get_project_structure(path, prefix=""):
    if not os.path.exists(path):
        return ""
    tree = ""
    try:
        items = sorted(os.listdir(path))
        # 제외 폴더/파일 및 이미지 확장자 필터링
        items = [i for i in items if i not in IGNORE_DIRS and i not in IGNORE_FILES]
        items = [i for i in items if not any(i.endswith(ext) for ext in IGNORE_EXTS)]
        
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
# 3. Navigation & Screens 분석 (React Native 구조 반영)
# ==============================================================================

def summarize_screens(mobile_path):
    summary = ""
    src_path = os.path.join(mobile_path, "src")
    
    # 1. Navigation 분석
    nav_path = os.path.join(src_path, "navigation")
    if os.path.exists(nav_path):
        summary += "### 🧭 Navigation (Stack & Tabs)\n"
        for file in sorted(os.listdir(nav_path)):
            if file.endswith('.js'):
                summary += f"- **{file}**\n"
        summary += "\n"

    # 2. Screens 분석
    screens_path = os.path.join(src_path, "screens")
    if os.path.exists(screens_path):
        summary += "### 📱 Screens\n"
        # 1차 레벨 (직접 들어있는 파일)
        root_files = [f for f in os.listdir(screens_path) if f.endswith('.js')]
        for f in root_files:
            summary += f"- 📄 `{f.replace('.js', '')}`\n"
            
        # 2차 레벨 (폴더별 분류: calendar, guardian 등)
        for item in sorted(os.listdir(screens_path)):
            full_path = os.path.join(screens_path, item)
            if os.path.isdir(full_path):
                summary += f"\n**📂 {item.upper()}**\n"
                for sub_f in sorted(os.listdir(full_path)):
                    if sub_f.endswith('.js'):
                        summary += f"- `{sub_f.replace('.js', '')}`\n"
                        
    if not summary:
        return "No navigation or screens found in src/navigation or src/screens."
        
    return summary

# ==============================================================================
# 4. API & Data Layer 분석 (shared/api)
# ==============================================================================

def summarize_api(mobile_path):
    summary = ""
    # shared/api 경로 탐색
    api_path = os.path.join(mobile_path, "src", "shared", "api")
    
    if os.path.exists(api_path):
        summary += "### 📡 Shared API (`src/shared/api`)\n"
        for file in sorted(os.listdir(api_path)):
            if file.endswith('.js'):
                summary += f"- **{file}**\n"
                # 파일 내부의 export 함수 간략 추출
                try:
                    with open(os.path.join(api_path, file), 'r', encoding='utf-8') as f:
                        content = f.read()
                        # export const, export default, export function 등 찾기
                        exports = re.findall(r'export\s+(?:const|function|class)\s+(\w+)', content)
                        if exports:
                            # 최대 3개만 표시하고 ... 처리
                            display = ", ".join(exports[:3])
                            if len(exports) > 3: display += ", ..."
                            summary += f"  - `Functions`: {display}\n"
                except: pass
        summary += "\n"
        
    # React Query 또는 Store 확인 (shared/chat 등)
    chat_store_path = os.path.join(mobile_path, "src", "shared", "chat")
    if os.path.exists(chat_store_path):
         summary += "### 💾 State & Store (`src/shared/chat`)\n"
         for file in os.listdir(chat_store_path):
             if file.endswith('.js'):
                 summary += f"- `{file}`\n"

    if not summary:
        return "No API files found in src/shared/api."
        
    return summary

# ==============================================================================
# 5. Components & Utils 분석
# ==============================================================================

def summarize_components(mobile_path):
    summary = ""
    
    # 1. Shared Components
    comp_path = os.path.join(mobile_path, "src", "shared", "components")
    if os.path.exists(comp_path):
        summary += "### 🧩 Shared Components\n"
        for file in os.listdir(comp_path):
            if file.endswith('.js'):
                summary += f"- `{file.replace('.js', '')}`\n"
        summary += "\n"

    # 2. Local Components (_parts)
    # src 폴더 전체를 뒤져서 _parts 폴더가 있으면 요약
    parts_found = []
    for root, dirs, files in os.walk(os.path.join(mobile_path, "src")):
        if "_parts" in dirs:
            rel_path = os.path.relpath(os.path.join(root, "_parts"), mobile_path)
            parts_found.append(rel_path)
            
    if parts_found:
        summary += "### 🧱 Local Parts (Sub-components)\n"
        for p in parts_found:
            summary += f"- `{p}`\n"
            
    # 3. Utils
    utils_path = os.path.join(mobile_path, "src", "shared", "utils")
    if os.path.exists(utils_path):
        summary += "\n### 🛠 Utilities\n"
        for file in os.listdir(utils_path):
            if file.endswith('.js'):
                summary += f"- `{file}`\n"

    return summary if summary else "No components found."

# ==============================================================================
# 메인 실행
# ==============================================================================

def build_table_of_contents():
    return """
1. [프로젝트 구조](#-1-프로젝트-구조)
2. [Navigation & Screens](#-2-navigation--screens)
3. [API & Data Layer](#-3-api--data-layer)
4. [Components & Utils](#-4-components--shared-utils)
5. [Installation](#-5-installation--run)
"""

def main():
    root = "."
    # mobile 폴더 찾기
    mobile_root = find_mobile_root(root)
    
    print(f"🚀 모바일 앱 분석 시작 (루트: {mobile_root})")
    
    tech_stack = analyze_tech_stack(mobile_root)
    # 구조는 전체(모바일 폴더 포함)를 보여주는 것이 좋음
    structure = get_project_structure(root)
    
    screens = summarize_screens(mobile_root)
    api = summarize_api(mobile_root)
    components = summarize_components(mobile_root)
    toc = build_table_of_contents()
    
    readme = README_TEMPLATE.format(
        table_of_contents=toc,
        tech_stack=tech_stack,
        project_structure=structure,
        screens_summary=screens,
        api_summary=api,
        components_summary=components,
        generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    
    with open("README.md", "w", encoding="utf-8") as f:
        f.write(readme)
        
    print("✅ Mobile README.md 자동 생성 완료!")

if __name__ == "__main__":
    main()
