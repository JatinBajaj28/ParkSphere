INSERT INTO users (id, name, email, password_hash, role, phone, created_at)
VALUES
  ('owner_demo_1', 'Operator Demo', 'owner1@gmail.com', '$2b$10$Y3xCRc0OzGLZ5o7jP79FjubnxGm5DcFO9eHFxb92YosRYlxqdXpqq', 'owner', '9999999999', '2026-05-01T00:00:00.000Z'),
  ('user_demo_1', 'Driver Demo', 'customer1@gmail.com', '$2b$10$Y3xCRc0OzGLZ5o7jP79FjubnxGm5DcFO9eHFxb92YosRYlxqdXpqq', 'user', '8888888888', '2026-05-01T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
