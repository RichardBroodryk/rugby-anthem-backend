-- ==========================================================
-- Rugby Anthem Zone
-- Production Video Catalogue Seed
-- ==========================================================

BEGIN;

TRUNCATE TABLE videos RESTART IDENTITY;

INSERT INTO videos
(title, description, thumbnail, url, category, published_at)
VALUES

-- ==========================================================
-- MATCH HIGHLIGHTS
-- ==========================================================

(
'Highlight 1',
'Latest Match Highlight',
'https://img.youtube.com/vi/kVZDDKXgDbs/hqdefault.jpg',
'https://www.youtube.com/watch?v=kVZDDKXgDbs',
'highlight',
NOW()
),

(
'Highlight 2',
'Latest Match Highlight',
'https://img.youtube.com/vi/EFm24QWlywI/hqdefault.jpg',
'https://www.youtube.com/watch?v=EFm24QWlywI',
'highlight',
NOW()
),

(
'Highlight 3',
'Latest Match Highlight',
'https://img.youtube.com/vi/qKCIZyiqjbc/hqdefault.jpg',
'https://www.youtube.com/watch?v=qKCIZyiqjbc',
'highlight',
NOW()
),

(
'Highlight 4',
'Latest Match Highlight',
'https://img.youtube.com/vi/4tewDq2UAtI/hqdefault.jpg',
'https://www.youtube.com/watch?v=4tewDq2UAtI',
'highlight',
NOW()
),

(
'Highlight 5',
'Latest Match Highlight',
'https://img.youtube.com/vi/NbrZZUW45G8/hqdefault.jpg',
'https://www.youtube.com/watch?v=NbrZZUW45G8',
'highlight',
NOW()
),

-- ==========================================================
-- GREATEST HITS
-- ==========================================================

(
'Greatest Hit 1',
'Greatest Rugby Hits',
'https://img.youtube.com/vi/8ojinRZ7YVA/hqdefault.jpg',
'https://www.youtube.com/watch?v=8ojinRZ7YVA',
'hit',
NOW()
),

(
'Greatest Hit 2',
'Greatest Rugby Hits',
'https://img.youtube.com/vi/9YuXU9EqCcs/hqdefault.jpg',
'https://www.youtube.com/watch?v=9YuXU9EqCcs',
'hit',
NOW()
),

(
'Greatest Hit 3',
'Greatest Rugby Hits',
'https://img.youtube.com/vi/MfyplR-SJ6Y/hqdefault.jpg',
'https://www.youtube.com/watch?v=MfyplR-SJ6Y',
'hit',
NOW()
),

(
'Greatest Hit 4',
'Greatest Rugby Hits',
'https://img.youtube.com/vi/cEhDe_G3Tyk/hqdefault.jpg',
'https://www.youtube.com/watch?v=cEhDe_G3Tyk',
'hit',
NOW()
),

(
'Greatest Hit 5',
'Greatest Rugby Hits',
'https://img.youtube.com/vi/Qk6O75Uvy54/hqdefault.jpg',
'https://www.youtube.com/watch?v=Qk6O75Uvy54',
'hit',
NOW()
),

-- ==========================================================
-- UNFORGETTABLE MOMENTS
-- ==========================================================

(
'Unforgettable Moment 1',
'Classic Rugby Moment',
'https://img.youtube.com/vi/qIbbMerrsF8/hqdefault.jpg',
'https://www.youtube.com/watch?v=qIbbMerrsF8',
'moment',
NOW()
),

(
'Unforgettable Moment 2',
'Classic Rugby Moment',
'https://img.youtube.com/vi/2Mp97PuJLAg/hqdefault.jpg',
'https://www.youtube.com/watch?v=2Mp97PuJLAg',
'moment',
NOW()
),

(
'Unforgettable Moment 3',
'Classic Rugby Moment',
'https://img.youtube.com/vi/N3AFvnA05gU/hqdefault.jpg',
'https://www.youtube.com/watch?v=N3AFvnA05gU',
'moment',
NOW()
),

(
'Unforgettable Moment 4',
'Classic Rugby Moment',
'https://img.youtube.com/vi/iEqaFc2kBNo/hqdefault.jpg',
'https://www.youtube.com/watch?v=iEqaFc2kBNo',
'moment',
NOW()
),

(
'Unforgettable Moment 5',
'Classic Rugby Moment',
'https://img.youtube.com/vi/IrDR40zh3U4/hqdefault.jpg',
'https://www.youtube.com/watch?v=IrDR40zh3U4',
'moment',
NOW()
),

-- ==========================================================
-- TRIES
-- ==========================================================

(
'Great Try 1',
'Outstanding Rugby Try',
'https://img.youtube.com/vi/26GRvJGXqtk/hqdefault.jpg',
'https://www.youtube.com/watch?v=26GRvJGXqtk',
'try',
NOW()
),

(
'Great Try 2',
'Outstanding Rugby Try',
'https://img.youtube.com/vi/OlUjaj_57Mk/hqdefault.jpg',
'https://www.youtube.com/watch?v=OlUjaj_57Mk',
'try',
NOW()
),

(
'Great Try 3',
'Outstanding Rugby Try',
'https://img.youtube.com/vi/5e28pvHetTU/hqdefault.jpg',
'https://www.youtube.com/watch?v=5e28pvHetTU',
'try',
NOW()
),

(
'Great Try 4',
'Outstanding Rugby Try',
'https://img.youtube.com/vi/CaFe2EpoKSU/hqdefault.jpg',
'https://www.youtube.com/watch?v=CaFe2EpoKSU',
'try',
NOW()
),

(
'Will Jordan Try Record',
'Featured Rugby Video',
'https://img.youtube.com/vi/iJRY0u9jG1k/hqdefault.jpg',
'https://www.youtube.com/watch?v=iJRY0u9jG1k',
'try',
NOW()
),

-- ==========================================================
-- BIGGEST TACKLES
-- ==========================================================

(
'Big Tackle 1',
'Massive Rugby Tackle',
'https://img.youtube.com/vi/CDH874XRAe0/hqdefault.jpg',
'https://www.youtube.com/shorts/CDH874XRAe0',
'tackle',
NOW()
),

(
'Big Tackle 2',
'Massive Rugby Tackle',
'https://img.youtube.com/vi/YY_oa8nwXcg/hqdefault.jpg',
'https://www.youtube.com/shorts/YY_oa8nwXcg',
'tackle',
NOW()
),

(
'Big Tackle 3',
'Massive Rugby Tackle',
'https://img.youtube.com/vi/8Y2JrgNz0l4/hqdefault.jpg',
'https://www.youtube.com/shorts/8Y2JrgNz0l4',
'tackle',
NOW()
),

(
'Big Tackle 4',
'Massive Rugby Tackle',
'https://img.youtube.com/vi/NgLGvENJXrU/hqdefault.jpg',
'https://www.youtube.com/watch?v=NgLGvENJXrU',
'tackle',
NOW()
),

(
'Big Tackle 5',
'Massive Rugby Tackle',
'https://img.youtube.com/vi/IxGRbU6EtWo/hqdefault.jpg',
'https://www.youtube.com/watch?v=IxGRbU6EtWo',
'tackle',
NOW()
),

-- ==========================================================
-- PLAYER / COACH INTERVIEWS
-- ==========================================================

(
'Interview 1',
'Player Interview',
'https://img.youtube.com/vi/AAEQDyOGY9Y/hqdefault.jpg',
'https://www.youtube.com/watch?v=AAEQDyOGY9Y',
'interview',
NOW()
),

(
'Interview 2',
'Player Interview',
'https://img.youtube.com/vi/I_QYws69ezw/hqdefault.jpg',
'https://www.youtube.com/watch?v=I_QYws69ezw',
'interview',
NOW()
),

(
'Interview 3',
'Player Interview',
'https://img.youtube.com/vi/0ZKk90-djbk/hqdefault.jpg',
'https://www.youtube.com/watch?v=0ZKk90-djbk',
'interview',
NOW()
),

(
'Interview 4',
'Player Interview',
'https://img.youtube.com/vi/GgqW74CXtpI/hqdefault.jpg',
'https://www.youtube.com/watch?v=GgqW74CXtpI',
'interview',
NOW()
),

(
'Interview 5',
'Player Interview',
'https://img.youtube.com/vi/SwnxD48-3xM/hqdefault.jpg',
'https://www.youtube.com/shorts/SwnxD48-3xM',
'interview',
NOW()
),

-- ==========================================================
-- PRESS CONFERENCES
-- ==========================================================

(
'Press Conference 1',
'Latest Rugby Press Conference',
'https://img.youtube.com/vi/tcIOkLAuncM/hqdefault.jpg',
'https://www.youtube.com/watch?v=tcIOkLAuncM',
'press',
NOW()
),

(
'Press Conference 2',
'Latest Rugby Press Conference',
'https://img.youtube.com/vi/TVB5zDHZRdA/hqdefault.jpg',
'https://www.youtube.com/watch?v=TVB5zDHZRdA',
'press',
NOW()
),

(
'Press Conference 3',
'Latest Rugby Press Conference',
'https://img.youtube.com/vi/2n1y3dPzheE/hqdefault.jpg',
'https://www.youtube.com/watch?v=2n1y3dPzheE',
'press',
NOW()
),

(
'Press Conference 4',
'Latest Rugby Press Conference',
'https://img.youtube.com/vi/E5IqjlxjDLg/hqdefault.jpg',
'https://www.youtube.com/watch?v=E5IqjlxjDLg',
'press',
NOW()
),

(
'Press Conference 5',
'Latest Rugby Press Conference',
'https://img.youtube.com/vi/T0BoEg7tHf0/hqdefault.jpg',
'https://www.youtube.com/watch?v=T0BoEg7tHf0',
'press',
NOW()
),

(
'Press Conference 6',
'Latest Rugby Press Conference',
'https://img.youtube.com/vi/bkctpwNzQOc/hqdefault.jpg',
'https://www.youtube.com/watch?v=bkctpwNzQOc',
'press',
NOW()
),

-- ==========================================================
-- EXPERT ANALYSIS
-- ==========================================================

(
'Expert Analysis 1',
'Latest Rugby Analysis',
'https://img.youtube.com/vi/7JI-0CRYnwQ/hqdefault.jpg',
'https://www.youtube.com/watch?v=7JI-0CRYnwQ',
'analysis',
NOW()
),

(
'Expert Analysis 2',
'Latest Rugby Analysis',
'https://img.youtube.com/vi/wuRZMzRB-20/hqdefault.jpg',
'https://www.youtube.com/watch?v=wuRZMzRB-20',
'analysis',
NOW()
),

(
'Expert Analysis 3',
'Latest Rugby Analysis',
'https://img.youtube.com/vi/_nc-Jo7l0BY/hqdefault.jpg',
'https://www.youtube.com/watch?v=_nc-Jo7l0BY',
'analysis',
NOW()
),

(
'Expert Analysis 4',
'Latest Rugby Analysis',
'https://img.youtube.com/vi/yty75Pk0ufU/hqdefault.jpg',
'https://www.youtube.com/watch?v=yty75Pk0ufU',
'analysis',
NOW()
),

(
'Expert Analysis 5',
'Latest Rugby Analysis',
'https://img.youtube.com/vi/qk-0WiB20iI/hqdefault.jpg',
'https://www.youtube.com/watch?v=qk-0WiB20iI',
'analysis',
NOW()

;

COMMIT;