-- Create a temporary test user for login testing
-- This will be done via the auth API, but first let's check if we can reset the password for the coordinator user

-- Let's create a simple way to test login by updating the existing test users
-- We'll need to use Supabase auth functions to properly set passwords

-- For now, let's ensure the main admin user works by checking their details
SELECT email, id FROM auth.users WHERE email = 'paulaneri@gmail.com';