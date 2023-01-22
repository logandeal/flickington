-- CreateTable
CREATE TABLE `movie` (
    `id` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `release_date` DATETIME(3) NULL,
    `language` VARCHAR(191) NOT NULL,
    `popularity` DOUBLE NOT NULL,
    `vote_count` INTEGER NOT NULL,
    `vote_average` DOUBLE NOT NULL,
    `certification` VARCHAR(191) NOT NULL,

    INDEX `movie_language_idx`(`language`),
    INDEX `movie_popularity_idx`(`popularity`),
    INDEX `movie_certification_idx`(`certification`),
    INDEX `movie_release_date_language_certification_idx`(`release_date`, `language`, `certification`),
    INDEX `movie_vote_count_vote_average_idx`(`vote_count`, `vote_average`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movie_search` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `movie_id` INTEGER NOT NULL,
    `genre` INTEGER NOT NULL,
    `genre_pair` INTEGER NOT NULL,
    `provider` INTEGER NOT NULL,

    INDEX `movie_search_movie_id_idx`(`movie_id`),
    INDEX `movie_search_genre_genre_pair_idx`(`genre`, `genre_pair`),
    INDEX `movie_search_provider_genre_genre_pair_idx`(`provider`, `genre`, `genre_pair`),
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
