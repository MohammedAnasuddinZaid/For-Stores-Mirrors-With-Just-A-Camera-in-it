-- Initial Database Schema for Virtual Try-On Platform
-- Database: SQLite (development) / PostgreSQL (production)

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL CHECK(category IN ('UPPER_BODY','LOWER_BODY','FULL_BODY','DRESS','GLASSES','HAT','JEWELRY','SHOES','OTHER')),
    brand TEXT DEFAULT '',
    sku TEXT UNIQUE,
    price REAL DEFAULT 0.0,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PROCESSING','READY','PUBLISHED','ARCHIVED')),
    image_url TEXT DEFAULT '',
    thumbnail_url TEXT DEFAULT '',
    try_on_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    published_at DATETIME
);

-- Try-On Sessions
CREATE TABLE IF NOT EXISTS try_on_sessions (
    id TEXT PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','EXPIRED','CLOSED')),
    device_metadata TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    last_activity_at DATETIME
);

-- Person Images
CREATE TABLE IF NOT EXISTS person_images (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    content_type TEXT DEFAULT 'image/jpeg',
    file_size INTEGER DEFAULT 0,
    width INTEGER DEFAULT 0,
    height INTEGER DEFAULT 0,
    status TEXT DEFAULT 'UPLOADED' CHECK(status IN ('UPLOADED','VALIDATING','READY','INVALID')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (session_id) REFERENCES try_on_sessions(id)
);

-- Try-On Jobs
CREATE TABLE IF NOT EXISTS try_on_jobs (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    person_image_id TEXT NOT NULL,
    status TEXT DEFAULT 'QUEUED' CHECK(status IN ('QUEUED','PROCESSING','SUCCEEDED','FAILED','TIMED_OUT','CANCELLED')),
    engine_name TEXT DEFAULT 'mock',
    engine_version TEXT DEFAULT '1.0.0',
    error_code TEXT,
    error_message TEXT,
    request_metadata TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    expires_at DATETIME,
    FOREIGN KEY (session_id) REFERENCES try_on_sessions(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (person_image_id) REFERENCES person_images(id)
);

-- Try-On Results
CREATE TABLE IF NOT EXISTS try_on_results (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL UNIQUE,
    storage_key TEXT NOT NULL,
    content_type TEXT DEFAULT 'image/jpeg',
    file_size INTEGER DEFAULT 0,
    width INTEGER DEFAULT 0,
    height INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (job_id) REFERENCES try_on_jobs(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON try_on_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_person_images_expires ON person_images(expires_at);
CREATE INDEX IF NOT EXISTS idx_tryon_jobs_status ON try_on_jobs(status);
CREATE INDEX IF NOT EXISTS idx_tryon_jobs_session ON try_on_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_tryon_results_expires ON try_on_results(expires_at);
