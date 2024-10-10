-- ALTER TABLE `storyline` ADD `userId` integer REFERENCES user(id);

-- ALTER TABLE `user` DROP COLUMN `current_storyline_id`;
-- ALTER TABLE `user` DROP COLUMN `current_storyline_step`;
-- ALTER TABLE `user` DROP COLUMN `completed_storylines`;