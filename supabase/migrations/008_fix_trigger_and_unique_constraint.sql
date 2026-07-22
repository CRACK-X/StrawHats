-- Fix the trigger to generate a unique qr_token_hash instead of empty string
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger as $$
begin
  insert into public.profiles (id, full_name, member_id, qr_token_hash)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'member_id', ''),
    encode(gen_random_bytes(32), 'hex')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop the existing unique constraint on qr_token_hash and replace with a partial one
-- that only applies to non-empty values (empty is allowed for legacy data)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_qr_token_hash_key;

CREATE UNIQUE INDEX profiles_qr_token_hash_unique_idx
  ON profiles (qr_token_hash)
  WHERE qr_token_hash != '';
