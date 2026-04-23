-- T-51: Idempotency index for reply detection — prevents double-inserting same message
create unique index if not exists replies_raw_message_id_key
  on public.replies (raw_message_id)
  where raw_message_id is not null;
