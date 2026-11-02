-- ====================================================================
-- SE7EN MONITOR — INITIAL DATABASE SCHEMA & RLS POLICIES
-- Platform: Supabase (PostgreSQL 15+)
-- Author: Se7en Studio Architecture Team
-- ====================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ORGANIZATIONS (Multi-tenancy / Municipios / Distritos Educativos)
create table if not exists public.organizations (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text not null unique,
    city text not null,
    province text not null default 'Río Negro',
    contact_email text,
    contact_phone text,
    is_active boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. USER PROFILES & ROLES
create type public.user_role as enum (
    'super_admin',
    'municipal_admin',
    'monitoring_operator',
    'maintenance_tech',
    'viewer'
);

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete set null,
    email text not null unique,
    full_name text not null,
    role public.user_role not null default 'viewer',
    phone text,
    avatar_url text,
    is_active boolean not null default true,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. SCHOOLS (Establecimientos Educativos)
create type public.educational_level as enum (
    'inicial',
    'primario',
    'secundario',
    'tecnico',
    'superior'
);

create table if not exists public.schools (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references public.organizations(id) on delete cascade,
    code text not null, -- ej: 'ESC-204'
    name text not null,
    address text not null,
    neighborhood text,
    city text not null default 'Catriel',
    province text not null default 'Río Negro',
    lat double precision not null,
    lng double precision not null,
    educational_level public.educational_level not null default 'primario',
    principal_name text,
    phone text,
    email text,
    perimeter_radius_meters integer not null default 200, -- Ordenanza Corredor Escolar Cuidado
    status text not null default 'operativo', -- 'operativo', 'en_obra', 'atencion_requerida'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_school_code_per_org unique(organization_id, code)
);

-- 4. CAMERAS (Dispositivos Fijos y Transmisores Móviles)
create type public.camera_status as enum (
    'online',
    'offline',
    'mantenimiento',
    'alerta'
);

create type public.camera_location_type as enum (
    'perimetro_exterior',
    'acceso_principal',
    'patio_general',
    'corredor_escolar',
    'porton_secundario'
);

create type public.camera_device_type as enum (
    'mobile_webrtc',
    'ip_dome',
    'ip_bullet',
    'ptz_exterior'
);

create table if not exists public.cameras (
    id uuid primary key default uuid_generate_v4(),
    school_id uuid not null references public.schools(id) on delete cascade,
    identifier text not null, -- ej: 'CAM-204-01'
    name text not null,
    location_type public.camera_location_type not null default 'corredor_escolar',
    location_detail text,
    device_type public.camera_device_type not null default 'ip_dome',
    status public.camera_status not null default 'offline',
    ip_address text,
    stream_type text not null default 'webrtc', -- 'webrtc', 'rtsp', 'hls'
    stream_url text,
    publish_token text, -- Token secreto para publicación WebRTC
    resolution text default '1080p FHD',
    fps integer default 30,
    is_live boolean default false,
    last_heartbeat timestamp with time zone,
    installed_at date default current_date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_camera_identifier unique(identifier)
);

-- 5. CAMERA SESSIONS (Para transmisión móvil WebRTC temporal)
create table if not exists public.camera_sessions (
    id uuid primary key default uuid_generate_v4(),
    camera_id uuid not null references public.cameras(id) on delete cascade,
    token text not null unique,
    broadcaster_peer_id text,
    viewer_count integer default 0,
    status text not null default 'pending', -- 'pending', 'connected', 'terminated'
    device_info jsonb default '{}'::jsonb,
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    terminated_at timestamp with time zone
);

-- 6. INCIDENTS (Gestión y CRM de Incidentes Escolares)
create type public.incident_priority as enum (
    'baja',
    'media',
    'alta',
    'critica'
);

create type public.incident_status as enum (
    'nuevo',
    'en_revision',
    'en_proceso',
    'resuelto',
    'cerrado'
);

create table if not exists public.incidents (
    id uuid primary key default uuid_generate_v4(),
    school_id uuid not null references public.schools(id) on delete cascade,
    camera_id uuid references public.cameras(id) on delete set null,
    code text not null unique, -- ej: 'INC-2026-001'
    type text not null,
    title text not null,
    description text not null,
    priority public.incident_priority not null default 'media',
    status public.incident_status not null default 'nuevo',
    assigned_to text,
    notes text,
    reported_at timestamp with time zone default timezone('utc'::text, now()) not null,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. ALERTS (Eventos de Telemetría e Infracciones)
create table if not exists public.alerts (
    id uuid primary key default uuid_generate_v4(),
    school_id uuid references public.schools(id) on delete cascade,
    camera_id uuid references public.cameras(id) on delete cascade,
    severity text not null check (severity in ('info', 'warning', 'critical')),
    title text not null,
    message text not null,
    acknowledged boolean default false,
    acknowledged_by uuid references public.profiles(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. MAINTENANCE TICKETS
create table if not exists public.maintenance_tickets (
    id uuid primary key default uuid_generate_v4(),
    code text not null unique,
    school_id uuid not null references public.schools(id) on delete cascade,
    camera_id uuid references public.cameras(id) on delete set null,
    technician text not null,
    title text not null,
    priority text not null default 'normal',
    status text not null default 'pendiente',
    scheduled_for timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. ACTIVITY LOGS (Auditoría inmutable para instituciones públicas)
create table if not exists public.activity_logs (
    id uuid primary key default uuid_generate_v4(),
    event_type text not null,
    title text not null,
    description text not null,
    entity_type text not null,
    entity_id uuid,
    actor text not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. MONITORING ROOMS (Salas de control multivista para operadores)
create table if not exists public.monitoring_rooms (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references public.organizations(id) on delete cascade,
    name text not null,
    layout_type text not null default 'grid_2x2', -- 'single', 'grid_2x2', 'grid_3x3'
    camera_ids uuid[] default '{}',
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.cameras enable row level security;
alter table public.camera_sessions enable row level security;
alter table public.incidents enable row level security;
alter table public.alerts enable row level security;
alter table public.maintenance_tickets enable row level security;
alter table public.activity_logs enable row level security;
alter table public.monitoring_rooms enable row level security;

-- Read policies for authenticated operators
create policy "Authenticated users can read organizations"
    on public.organizations for select
    to authenticated
    using (true);

create policy "Authenticated users can read schools"
    on public.schools for select
    to authenticated
    using (true);

create policy "Authenticated users can read cameras"
    on public.cameras for select
    to authenticated
    using (true);

create policy "Authenticated users can read incidents"
    on public.incidents for select
    to authenticated
    using (true);

-- Anyone with valid publication token can view camera session to publish WebRTC
create policy "Public token session access for mobile publication"
    on public.camera_sessions for select
    to anon, authenticated
    using (expires_at > now() and status != 'terminated');
