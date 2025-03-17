CREATE TABLE IF NOT EXISTS regulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    publish_date DATE NOT NULL,
    effective_date DATE,
    source TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interpretations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    regulation_id INTEGER NOT NULL,
    interpretation TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (regulation_id) REFERENCES regulations(id)
);

CREATE INDEX IF NOT EXISTS idx_regulations_publish_date ON regulations(publish_date);
CREATE INDEX IF NOT EXISTS idx_regulations_title ON regulations(title); 