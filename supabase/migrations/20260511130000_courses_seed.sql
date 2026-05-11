-- dataeasy.kr/program 의 32개 과정을 시드로 주입.
-- 슬러그는 영문 케밥-케이스로 새로 정의. 원본의 [금융 특화]/[유통 특화]/[표준 과정] prefix는 제목에 그대로 유지.
-- price/duration_hours/thumbnail_url 은 원본에 명시되지 않아 기본값(0/null)으로 둔다.

insert into public.courses (slug, title, summary, level, sort_order, status) values
  -- 초급
  ('financial-ai-leadership', '[금융 특화] 금융 AI 리더십 및 전략 과정', '데이터 사일로를 진단하고 AI 거버넌스 수립, ROI 기반의 의사결정 체계(DDI), 신사업 타당성 검토 등 전사적 비즈니스 혁신 로드맵을 설계하는 리더 전용 과정입니다', 'beginner', 1, 'published'),
  ('retail-leadership-restructure', '[유통 특화] 유통 리더십 및 구조혁신 과정', '적자 매장 턴어라운드, 데이터 거버넌스 통합, SCM 4.0 고도화 등 유통 비즈니스 전 과정의 AI 내재화를 위한 경영 전략과 의사결정 시스템을 구축하는 과정입니다', 'beginner', 2, 'published'),
  ('ai-literacy', '[표준 과정] AI 리터러시', '생성형 AI를 포함한 AI의 핵심 개념과 활용 원리를 빠르게 이해하고, 업무에서 안전하고 효과적으로 활용하는 기본 역량을 구축합니다', 'beginner', 3, 'published'),
  ('data-literacy', '[표준 과정] 데이터 리터러시', '데이터 읽기·해석·활용의 기본기를 학습하고, 일상 업무에서 지표와 데이터로 소통·판단하는 기초 역량을 강화합니다', 'beginner', 4, 'published'),
  ('manager-ai-leadership', '[표준 과정] 관리자 AI 리더십', '관리자의 관점에서 AI 도입·활용 방향을 정리하고, 조직 내 활용 문화와 실행 과제를 설계하는 리더십 프레임을 학습합니다', 'beginner', 5, 'published'),
  ('genai-productivity', '[표준 과정] 생성형 AI 활용 업무 효율화', '문서 작성, 요약, 기획, 커뮤니케이션 등 반복 업무를 생성형 AI로 표준화하고, 바로 적용 가능한 업무 생산성 패턴을 실습합니다', 'beginner', 6, 'published'),
  ('data-basics-1day', '초보자를 위한 데이터분석 기초 원데이 특강', '데이터분석 입문자를 위한 과정으로, 엑셀을 다뤄본적이 없거나 어려워하는 분들을 위해 데이터 분석 기초와 엑셀 활용법을 배울 수 있습니다', 'beginner', 7, 'published'),
  ('data-decision-1day', '리더들을 위한 데이터 의사 결정 원데이 교육', '관리자급 리더들의 데이터 기반 의사결정 문화를 이해하고, Data, AI의 최신 트렌드 및 분석 툴 활용 역량을 함양하는 과정입니다', 'beginner', 8, 'published'),
  ('excel-data-3days', '엑셀로 배우는 데이터 분석 기초 3일 마스터', '엑셀 사용 경험은 있으나, 데이터 분석 경험이 적은 초보자들을 대상으로 데이터 분석부터 시각화까지 배울 수 있는 과정입니다', 'beginner', 9, 'published'),
  ('data-viz-eda-3days', '데이터시각화 EDA 3일 코스', '탐색적 데이터 분석(EDA)에 대한 기초적인 실습과 더불어 다양한 방법으로 분석한 데이터를 시각화 하는 방법을 배웁니다', 'beginner', 10, 'published'),
  ('sql-basics', '초보자를 위한 데이터관리 SQL 실무 과정', 'SQL 기반의 환경에서 데이터 관리를 해본 적 없거나, 시작해보고 싶은 사람들을 위한 과정으로 SQL에 대한 기초 학습 과정입니다', 'beginner', 11, 'published'),

  -- 중급
  ('ai-banking', '[금융 특화] AI 뱅킹 실무 과정', '파이썬과 머신러닝(ML) 알고리즘을 활용해 신용평가(CSS) 모델링, 초개인화 디지털 마케팅, 상호금융 특화 AI 서비스를 직접 구현해보는 현업 실무자 과정입니다', 'intermediate', 12, 'published'),
  ('ai-scm-logistics', '[유통 특화] AI SCM 및 물류 혁신 과정', '정형 데이터 분석(Pandas)과 예측 모델을 통해 복잡한 수요를 예측하고, 운송 경로 최적화 및 스마트 창고 관리를 실습하여 현업의 물류 비용을 직접 절감하는 과정입니다', 'intermediate', 13, 'published'),
  ('ai-nocode-decision', '[표준 과정] AI 노코드 데이터 의사결정', '노코드 분석 도구와 생성형 AI를 결합해 데이터를 분석하고, 의사결정에 필요한 인사이트 및 보고서 산출물을 만드는 실습 중심 과정입니다', 'intermediate', 14, 'published'),
  ('ai-service-planning', '[표준 과정] AI 서비스 융합 기획', 'AI를 서비스/업무에 접목하기 위한 문제정의, 사용자 시나리오, 요구사항과 지표를 설계하고 실행 가능한 기획 산출물을 완성합니다', 'intermediate', 15, 'published'),
  ('data-analysis-cases', '[표준 과정] 융합 데이터 분석 사례 교육', '실무형 데이터셋 기반 사례를 통해 문제정의부터 분석·시각화·해석까지 수행하고, 조직에 적용 가능한 분석 관점과 산출물을 확보합니다', 'intermediate', 16, 'published'),
  ('nocoding-data-analysis', '노코딩 데이터 분석 Excel/Orange', '데이터 수집에서부터 전처리, 분석 및 시각화까지 데이터 분석에 관한 전반적인 과정을 배우고, 코딩 없이 머신러닝을 통해 데이터 분석을 배울 수 있는 교육 과정입니다', 'intermediate', 17, 'published'),
  ('python-data-analysis', '파이썬을 활용한 데이터 분석', '파이썬으로 데이터를 수집에서 전처리, 분석까지 하는 과정을 거치고, 머신러닝을 통한 기초적인 분석 방법을 학습합니다', 'intermediate', 18, 'published'),
  ('ml-data-analysis', '머신러닝 입문자들을 위한 인공지능 데이터 분석 과정', '머신러닝/딥러닝 입문자를 위한 머신러닝 기초 이론을 학습하고, 노코딩 머신러닝 툴 실습부터 머신러닝 라이브러리 실습까지 실무에서 사용하는 머신러닝에 대한 기초 실습 및 개념을 배웁니다', 'intermediate', 19, 'published'),
  ('sql-advanced', 'SQL을 활용한 데이터 분석 실무 심화 과정', '데이터분석과 데이터베이스 최적화를 중점으로 학습하고자하는 중급 학습자 대상의 실무 교육 과정입니다', 'intermediate', 20, 'published'),
  ('bigdata-analysis', '빅데이터 활용을 위한 데이터 분석 과정', '빅데이터 환경을 고려한 데이터 분석 방법을 학습하는 중급 학습자 대상의 실무 교육 과정입니다', 'intermediate', 21, 'published'),
  ('chatgpt-productivity', 'ChatGPT를 활용한 생산성 향상 실무 과정', '다양한 직무 종사자들이 ChatGPT를 활용하여 업무 효율성을 높이고, 데이터 분석 모델 적용의 흐름을 학습합니다', 'intermediate', 22, 'published'),

  -- 고급
  ('ai-investment-insurance', '[금융 특화] AI 투자 및 보험 과정', '시계열 분석과 딥러닝을 활용한 알고리즘 트레이딩, 강화학습 기반의 자산 배분 전략, 그리고 인슈어테크(언더라이팅, FDS) 혁신을 주도하는 최고급 심화 과정입니다', 'advanced', 23, 'published'),
  ('ai-foodtech-livestock', '[유통 특화] AI 푸드테크 및 축산 과정', '비전 AI를 활용한 품질 검사(QC) 및 예지 보전으로 스마트 팩토리를 구현하고, NLP 마이닝 기반의 시장 트렌드 분석과 원료 배합 최적화로 R&D 역량을 극대화하는 과정입니다', 'advanced', 24, 'published'),
  ('nocode-ai-service', '[표준 과정] 노코드 AI 서비스 구현', '생성형 AI 및 AI 코딩 도구를 활용해 서비스 기획부터 프로토타입 개발까지 진행하며, MVP 수준의 서비스 구현 경험을 확보합니다', 'advanced', 25, 'published'),
  ('tensorflow-ml-dl', '[표준 과정] Tensorflow로 구현하는 머신러닝·딥러닝 데이터분석', '머신러닝/딥러닝 핵심 이론을 이해하고, TensorFlow로 신경망 모델을 직접 구현하며 데이터 분석과 모델링을 실전 형태로 수행합니다', 'advanced', 26, 'published'),
  ('ai-data-development', '[표준 과정] AI 융합 데이터 분석·개발 활용', 'ChatGPT/Colab/NotebookLM 등 도구를 결합해 분석-개발 흐름을 완주하고, 재사용 가능한 자동화·분석 템플릿을 구축합니다', 'advanced', 27, 'published'),
  ('llm-prompt-hackathon', '[표준 과정] LLM 프롬프트 해커톤', '팀 기반 해커톤으로 LLM 활용 전략과 프롬프트 평가·개선 방법을 학습하고, 반복 개선 로그를 포함한 MVP를 완성합니다', 'advanced', 28, 'published'),
  ('llm-mvp-project', '[표준 과정] LLM 서비스 개발 미니 프로젝트', '적용 사례를 분석하고 n8n·노코드/로우코드로 워크플로우를 구현하며, RAG·평가(Eval)·운영 가이드를 포함한 MVP를 제작합니다', 'advanced', 29, 'published'),
  ('chatgpt-advanced-analysis', 'ChatGPT를 활용한 고급 데이터 분석 및 자동화 과정', 'ChatGPT, Gemini 등 LLM 서비스를 활용하여 데이터를 업로드하고, 분석하는 과정을 배우고, 데이터 분석 업무 자동화에 대해 실습하는 과정입니다', 'advanced', 30, 'published'),
  ('transformer-deep-learning', 'Transformer 기반 딥러닝 마스터 과정', 'Tensorflow/PyTorch 등 신경망 구성 실습부터 Transformer모델을 기반하여 최신 트렌드의 딥러닝 모델들을 학습하며, 자연어 처리까지 배우는 딥러닝 실습 과정입니다', 'advanced', 31, 'published'),
  ('latest-data-llm', '최신 기술로 배우는 데이터 분석과 LLM 활용 과정', '시계열 데이터 분석 등 최신 데이터 분석 방법 및 시각화를 배우고, LLM 기술 동향 및 실습을 통해 데이터 분석 자동화를 배웁니다', 'advanced', 32, 'published')
on conflict (slug) do nothing;
