-- TABLE 1: users
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'owner', 'admin')),
  full_name text NOT NULL,
  phone text UNIQUE,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- TABLE 2: salons
CREATE TABLE salons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id),
  name text NOT NULL,
  address text NOT NULL,
  lat float8 NOT NULL,
  lng float8 NOT NULL,
  is_published boolean DEFAULT false,
  open_time time NOT NULL,
  close_time time NOT NULL,
  avg_rating float4 DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- TABLE 3: services
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL,
  duration_min int NOT NULL,
  category text,
  created_at timestamptz DEFAULT now()
);

-- TABLE 4: bookings
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES users(id),
  salon_id uuid REFERENCES salons(id),
  service_id uuid REFERENCES services(id),
  slot_start timestamptz NOT NULL,
  token_number int,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- TABLE 5: loyalty_points
CREATE TABLE loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES users(id),
  salon_id uuid REFERENCES salons(id),
  points int DEFAULT 0,
  total_earned int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- ROW LEVEL SECURITY (RLS) ENABLEMENT
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Users can only read/update their own profile
CREATE POLICY "Users can read own profile" ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users FOR UPDATE
  USING (auth.uid() = id);

-- Customers can only see their own bookings
CREATE POLICY "Customers view own bookings" ON bookings FOR SELECT
  USING (auth.uid() = customer_id);

-- Owners can only edit their own salons
CREATE POLICY "Owners update own salons" ON salons FOR UPDATE
  USING (auth.uid() = owner_id);

-- Everyone can view published salons
CREATE POLICY "Anyone views published salons" ON salons FOR SELECT
  USING (is_published = true);

-- Owners can view all bookings for their salon
CREATE POLICY "Owners view salon bookings" ON bookings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM salons WHERE salons.id = bookings.salon_id AND salons.owner_id = auth.uid()
  ));
