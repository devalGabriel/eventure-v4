-- AddForeignKey
ALTER TABLE `EventInvitation` ADD CONSTRAINT `EventInvitation_needId_fkey` FOREIGN KEY (`needId`) REFERENCES `EventNeed`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
