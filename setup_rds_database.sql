-- ESQUEMA PROFESIONAL PARA ORANJEAPP EN AWS RDS (POSTGRESQL 16)
-- Creado para: David (Gestión DA)

-- 1. EXTENSIONES (Para generar UUIDs si fuera necesario)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE HOTELES
CREATE TABLE IF NOT EXISTS hotels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    image_url TEXT,
    zone TEXT CHECK (zone IN ('Centro', 'Norte', 'Noroeste')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE EMPLEADOS (El núcleo de la gestión)
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY, -- ID Interno (ej: emp-171234567)
    employee_number TEXT UNIQUE NOT NULL, -- ID Público (ej: 26-001)
    name TEXT NOT NULL,
    current_hotel_id TEXT REFERENCES hotels(id),
    is_active BOOLEAN DEFAULT TRUE,
    role TEXT NOT NULL,
    employee_type TEXT CHECK (employee_type IN ('permanente', 'temporal')),
    is_blacklisted BOOLEAN DEFAULT FALSE,
    payroll_type TEXT CHECK (payroll_type IN ('timesheet', 'Workrecord')),
    last_reviewed_timestamp TIMESTAMPTZ,
    documentacion_completa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HISTORIAL DE TRASLADOS (ASIGNACIONES)
CREATE TABLE IF NOT EXISTS employee_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    hotel_id TEXT REFERENCES hotels(id),
    role TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT CHECK (status IN ('active', 'inactive', 'transferred')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SOLICITUDES DE PERSONAL (Staffing Requests)
CREATE TABLE IF NOT EXISTS staffing_requests (
    id SERIAL PRIMARY KEY,
    request_number TEXT UNIQUE NOT NULL, -- Formato: SR26-001
    hotel_id TEXT REFERENCES hotels(id),
    request_type TEXT CHECK (request_type IN ('permanente', 'temporal')),
    num_of_people INTEGER NOT NULL DEFAULT 1,
    role TEXT NOT NULL,
    start_date DATE NOT NULL,
    status TEXT DEFAULT 'Pendiente',
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. HISTORIAL DE CUMPLIMIENTO (Compliance)
CREATE TABLE IF NOT EXISTS compliance_history (
    id SERIAL PRIMARY KEY,
    employee_id TEXT REFERENCES employees(id),
    review_date TIMESTAMPTZ DEFAULT NOW(),
    week_of_year INTEGER NOT NULL,
    year INTEGER NOT NULL,
    compliance_status TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ÍNDICES PARA VELOCIDAD (Búsquedas rápidas)
CREATE INDEX idx_employees_number ON employees(employee_number);
CREATE INDEX idx_employees_hotel ON employees(current_hotel_id);
CREATE INDEX idx_requests_status ON staffing_requests(status);
CREATE INDEX idx_assignments_active ON employee_assignments(employee_id) WHERE status = 'active';

-- 8. TRIGGER PARA ACTUALIZAR FECHA DE MODIFICACIÓN
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_modtime
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
