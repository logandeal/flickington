-- CreateTable
CREATE TABLE `movie` (
    `id` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `release_date` DATETIME(3) NULL,
    `language` VARCHAR(191) NOT NULL,

    INDEX `movie_language_release_date_idx`(`language`, `release_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movie_search` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `movie_id` INTEGER NOT NULL,
    `genre` INTEGER NOT NULL,
    `provider` INTEGER NOT NULL,

    INDEX `movie_search_genre_provider_idx`(`genre`, `provider`),
    INDEX `movie_search_movie_id_genre_provider_idx`(`movie_id`, `genre`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movie_load` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `start_id` INTEGER NOT NULL,
    `end_id` INTEGER NOT NULL,
    `completed_count` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `movie_search` ADD CONSTRAINT `movie_search_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movie`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
