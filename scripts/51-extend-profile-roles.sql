-- Ensure profiles.role supports the expanded leadership roles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE table_name = 'profiles'
      AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (
    role IN (
      'MD',
      'ED',
      'Head of Operations',
      'Operations and Fleet Officer',
      'Accountant',
      'Staff'
    )
  );
