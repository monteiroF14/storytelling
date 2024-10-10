-- -- Step 1: Remove the existing 'created' and 'updated' columns
-- ALTER TABLE storyline DROP COLUMN created;
-- ALTER TABLE storyline DROP COLUMN updated;

-- -- Step 2: Add the new 'created' and 'updated' columns with INTEGER type and default to the current timestamp
-- ALTER TABLE storyline ADD COLUMN created INTEGER NOT NULL DEFAULT (strftime('%s', 'now'));
-- ALTER TABLE storyline ADD COLUMN updated INTEGER NOT NULL DEFAULT (strftime('%s', 'now'));

-- -- Step 3: Update existing records to set 'created' and 'updated' to the current timestamp
-- UPDATE storyline SET created = strftime('%s', 'now'), updated = strftime('%s', 'now');
