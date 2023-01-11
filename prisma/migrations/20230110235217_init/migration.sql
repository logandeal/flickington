-- CreateTable
CREATE TABLE `Movie` (
    `id` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `release_date` DATETIME(3) NULL,
    `language` VARCHAR(191) NOT NULL,
    `providers` JSON NOT NULL,
    `genres` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
