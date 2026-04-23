ALTER TABLE contacts
  ADD COLUMN unsubscribed_at TIMESTAMPTZ NULL,
  ADD COLUMN unsubscribed_source TEXT NULL;

CREATE INDEX contacts_unsubscribed_at_idx ON contacts (unsubscribed_at)
  WHERE unsubscribed_at IS NOT NULL;
