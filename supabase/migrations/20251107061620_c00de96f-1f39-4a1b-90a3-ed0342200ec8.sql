-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('manufacturer', 'pharmacist');

-- Create enum for batch status
CREATE TYPE public.batch_status AS ENUM ('created', 'in_transit', 'delivered', 'received');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  organization_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create medicines table
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  manufacturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT,
  dosage_form TEXT NOT NULL,
  strength TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on medicines
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

-- Medicines policies
CREATE POLICY "Everyone can view medicines"
  ON public.medicines FOR SELECT
  USING (true);

CREATE POLICY "Manufacturers can create medicines"
  ON public.medicines FOR INSERT
  WITH CHECK (
    auth.uid() = manufacturer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manufacturer')
  );

CREATE POLICY "Manufacturers can update their own medicines"
  ON public.medicines FOR UPDATE
  USING (
    auth.uid() = manufacturer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manufacturer')
  );

-- Create batches table
CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  manufacturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL UNIQUE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  manufacturing_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status batch_status NOT NULL DEFAULT 'created',
  current_location TEXT,
  pharmacist_id UUID REFERENCES public.profiles(id),
  delivery_confirmed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on batches
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Batches policies
CREATE POLICY "Manufacturers can view their own batches"
  ON public.batches FOR SELECT
  USING (
    auth.uid() = manufacturer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manufacturer')
  );

CREATE POLICY "Pharmacists can view batches assigned to them"
  ON public.batches FOR SELECT
  USING (
    auth.uid() = pharmacist_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pharmacist')
  );

CREATE POLICY "Manufacturers can create batches"
  ON public.batches FOR INSERT
  WITH CHECK (
    auth.uid() = manufacturer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manufacturer')
  );

CREATE POLICY "Manufacturers can update their own batches"
  ON public.batches FOR UPDATE
  USING (
    auth.uid() = manufacturer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manufacturer')
  );

CREATE POLICY "Pharmacists can update batches assigned to them"
  ON public.batches FOR UPDATE
  USING (
    auth.uid() = pharmacist_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pharmacist')
  );

-- Create batch status history table for tracking
CREATE TABLE public.batch_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  status batch_status NOT NULL,
  location TEXT,
  notes TEXT,
  changed_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on batch status history
ALTER TABLE public.batch_status_history ENABLE ROW LEVEL SECURITY;

-- Batch status history policies
CREATE POLICY "Users can view status history of their batches"
  ON public.batch_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.batches b
      WHERE b.id = batch_id AND 
      (b.manufacturer_id = auth.uid() OR b.pharmacist_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert status history"
  ON public.batch_status_history FOR INSERT
  WITH CHECK (auth.uid() = changed_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at
  BEFORE UPDATE ON public.medicines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle user signup and create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, organization_name, contact_email, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'pharmacist'),
    COALESCE(NEW.raw_user_meta_data->>'organization_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'contact_email', NEW.email),
    NEW.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to log batch status changes
CREATE OR REPLACE FUNCTION public.log_batch_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.batch_status_history (batch_id, status, location, changed_by, notes)
    VALUES (NEW.id, NEW.status, NEW.current_location, auth.uid(), NEW.notes);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for batch status changes
CREATE TRIGGER log_batch_status_changes
  AFTER INSERT OR UPDATE ON public.batches
  FOR EACH ROW
  EXECUTE FUNCTION public.log_batch_status_change();