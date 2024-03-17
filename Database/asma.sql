-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : dim. 17 mars 2024 à 01:35
-- Version du serveur : 10.4.28-MariaDB
-- Version de PHP : 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `asma`
--

-- --------------------------------------------------------

--
-- Structure de la table `branches`
--

CREATE TABLE `branches` (
  `id` int(30) NOT NULL,
  `branch_code` varchar(50) NOT NULL,
  `street` text NOT NULL,
  `city` text NOT NULL,
  `state` text NOT NULL,
  `zip_code` varchar(50) NOT NULL,
  `country` text NOT NULL,
  `contact` varchar(100) NOT NULL,
  `date_created` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `branches`
--

INSERT INTO `branches` (`id`, `branch_code`, `street`, `city`, `state`, `zip_code`, `country`, `contact`, `date_created`) VALUES
(4, 'dIbUK5mEh96f0Zc', 'Sample', 'Sample', 'Sample', '123456', 'Philippines', '123456', '2023-11-27 13:31:49'),
(9, 'PRmKESVF4tWCzl2', 'tunis', 'Pune', 'tunis', '411038', 'tunis', '9090909090', '2023-08-03 13:04:18'),
(11, 'Fe8czxW94PY2lwq', 'tunis', 'pune', 'tunis', ' 411004', 'tunis', '6060707070', '2023-08-03 13:08:24');

-- --------------------------------------------------------

--
-- Structure de la table `parcels`
--

CREATE TABLE `parcels` (
  `id` int(30) NOT NULL,
  `reference_number` varchar(100) NOT NULL,
  `sender_name` text NOT NULL,
  `sender_address` text NOT NULL,
  `sender_contact` text NOT NULL,
  `recipient_name` text NOT NULL,
  `recipient_address` text NOT NULL,
  `recipient_contact` text NOT NULL,
  `type` int(1) NOT NULL COMMENT '1 = Deliver, 2=Pickup',
  `from_branch_id` varchar(30) NOT NULL,
  `to_branch_id` varchar(30) NOT NULL,
  `weight` varchar(100) NOT NULL,
  `height` varchar(100) NOT NULL,
  `width` varchar(100) NOT NULL,
  `length` varchar(100) NOT NULL,
  `price` float NOT NULL,
  `status` int(2) NOT NULL DEFAULT 0,
  `date_created` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `parcels`
--

INSERT INTO `parcels` (`id`, `reference_number`, `sender_name`, `sender_address`, `sender_contact`, `recipient_name`, `recipient_address`, `recipient_contact`, `type`, `from_branch_id`, `to_branch_id`, `weight`, `height`, `width`, `length`, `price`, `status`, `date_created`) VALUES
(1, '201406231415', 'John Smith', 'Sample', '+123456', 'Claire Blake', 'Sample', 'Sample', 1, '1', '0', '30kg', '12in', '12in', '15in', 2500, 7, '2023-11-26 16:15:46'),
(3, '983186540795', 'John Smith', 'Sample', '+123456', 'Claire Blake', 'Sample', 'Sample', 2, '1', '3', '20Kg', '10in', '10in', '10in', 1500, 2, '2023-11-26 16:46:03'),
(10, '798438738398', ' Mayuri', ' Shankar Bhawan, 2nd Floor, Ravi Shankar Marg, Kothrud, Pune, Maharashtra 411038', '9090909090', 'k', ' Shankar Bhawan, 2nd Floor, Ravi Shankar Marg, Kothrud, Pune, Maharashtra 411038', '9090909090', 2, '5', '9', '45', '120', '677', '670', 800, 0, '2023-08-03 13:14:13'),
(11, '701589720901', 'Radhika', '2nd Floor, Opposite Hotel Central Park, Apte Road, near HDFC Bank, Deccan Gymkhana, Pune, Maharashtra 411005   ', '7070707070', 'Gandhi', '2nd Floor, Opposite Hotel Central Park, Apte Road, near HDFC Bank, Deccan Gymkhana, Pune, Maharashtra 411005   ', '7070707070', 2, '5', '11', '55', '160', '455', '555', 7000, 0, '2023-08-03 13:18:45'),
(12, '618331985221', 'Rakesh', '759/8, Off, Prabhat Road, next to Sahyadri Hospital, Deccan Gymkhana, Pune, Maharashtra 411004', '6060707070', 'Jain', '759/8, Off, Prabhat Road, next to Sahyadri Hospital, Deccan Gymkhana, Pune, Maharashtra 411004', '6060707070', 2, '5', '', '45', '160', '455', '670', 6000, 0, '2023-08-03 13:20:55'),
(13, '275728717086', 'Radhika', ' Shankar Bhawan, 2nd Floor, Ravi Shankar Marg, Kothrud, Pune, Maharashtra 411038', '9090909090', 'Gandhi', ' Shankar Bhawan, 2nd Floor, Ravi Shankar Marg, Kothrud, Pune, Maharashtra 411038', '9090909090', 2, '9', '9', '45', '120', '677', '67', 6000, 0, '2023-08-03 13:22:09'),
(14, '753697280349', 'Mayuri ', 'Shankar Bhawan, 2nd Floor, Ravi Shankar Marg, Kothrud, Pune, Maharashtra 411038', ' 9090909090', 'k', 'Shankar Bhawan, 2nd Floor, Ravi Shankar Marg, Kothrud, Pune, Maharashtra 411038', ' 9090909090', 2, '6', '10', '45', '160', '677', '670', 7000, 0, '2023-08-03 13:27:19'),
(15, '667392903463', 'Radhika ', '2nd Floor, Opposite Hotel Central Park, Apte Road, near HDFC Bank, Deccan Gymkhana, Pune,', '7070707070', 'Gandhi', '2nd Floor, Opposite Hotel Central Park, Apte Road, near HDFC Bank, Deccan Gymkhana, Pune,', '7070707070', 2, '6', '4', '45', '160', '455', '555', 7000, 0, '2023-08-03 13:33:33'),
(16, '429522865395', 'mayuri', 'Shankar Bhawan, 2nd Floor, Ravi Shankar Marg, Kothrud, Pune, Maharashtra 411038', '9090909090', 'k', 'Shankar Bhawan, 2nd Floor, Ravi Shankar Marg, Kothrud, Pune, Maharashtra 411038', '9090909090', 2, '6', '6', '45', '120', '677', '67', 7000, 0, '2023-08-03 13:34:34'),
(17, '726627862410', 'mayuri', 'Shankar Bhawan, 2nd Floor, Ravi Shankar Marg, Kothrud, Pune, Maharashtra 411038', '9090909090', 'k', 'Shankar Bhawan, 2nd Floor, Ravi Shankar Marg, Kothrud, Pune, Maharashtra 411038', '9090909090', 2, '6', '5', '45', '120', '677', '67', 6000, 0, '2023-08-03 14:27:17'),
(18, '026242450983', 'Radhika', 'Shankar Bhawan, 2nd Floor, Ravi Shankar Marg, Kothrud, Pune, Maharashtra 411038', '7070707070', 'Gandhi', 'Shankar Bhawan, 2nd Floor, Ravi Shankar Marg, Kothrud, Pune, Maharashtra 411038', '7070707070', 2, '6', '9', '45', '120', '677', '670', 5000, 5, '2023-08-03 14:29:54'),
(19, '923246250964', 'Radhika', '2nd Floor, Opposite Hotel Central Park, Apte Road, near HDFC Bank, Deccan Gymkhana, Pune,', '7070707070', 'ali', 'sousse', '7070707070', 2, '9', '9', '45', '160', '455', '670', 6000, 0, '2023-08-03 14:33:19'),
(20, '199897593227', 'Radhika', '2nd Floor, Opposite Hotel Central Park, Apte Road, near HDFC Bank, Deccan Gymkhana, Pune,', '7070707070', 'Gandhi', '2nd Floor, Opposite Hotel Central Park, Apte Road, near HDFC Bank, Deccan Gymkhana, Pune,', '7070707070', 2, '5', '9', '45', '160', '455', '555', 7000, 4, '2023-08-03 14:45:56');

-- --------------------------------------------------------

--
-- Structure de la table `parcel_tracks`
--

CREATE TABLE `parcel_tracks` (
  `id` int(30) NOT NULL,
  `parcel_id` int(30) NOT NULL,
  `status` int(2) NOT NULL,
  `date_created` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `parcel_tracks`
--

INSERT INTO `parcel_tracks` (`id`, `parcel_id`, `status`, `date_created`) VALUES
(1, 2, 1, '2023-11-27 09:53:27'),
(2, 3, 1, '2023-11-27 09:55:17'),
(3, 1, 1, '2023-11-27 10:28:01'),
(4, 1, 2, '2023-11-27 10:28:10'),
(5, 1, 3, '2023-11-27 10:28:16'),
(6, 1, 4, '2023-11-27 11:05:03'),
(7, 1, 5, '2023-11-27 11:05:17'),
(8, 1, 7, '2023-11-27 11:05:26'),
(9, 3, 2, '2023-11-27 11:05:41'),
(10, 6, 1, '2023-11-27 14:06:57'),
(11, 20, 4, '2023-08-11 21:36:28'),
(12, 18, 5, '2023-08-11 21:36:36');

-- --------------------------------------------------------

--
-- Structure de la table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(30) NOT NULL,
  `name` text NOT NULL,
  `email` varchar(200) NOT NULL,
  `contact` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `cover_img` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `system_settings`
--

INSERT INTO `system_settings` (`id`, `name`, `email`, `contact`, `address`, `cover_img`) VALUES
(1, 'Gestion de colis', 'asma@yahoo.Fr', '+21622000111', 'tunis', '');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(30) NOT NULL,
  `firstname` varchar(200) NOT NULL,
  `lastname` varchar(200) NOT NULL,
  `email` varchar(200) NOT NULL,
  `password` text NOT NULL,
  `type` tinyint(1) NOT NULL DEFAULT 2 COMMENT '1 = admin, 2 = staff',
  `branch_id` int(30) NOT NULL,
  `date_created` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `firstname`, `lastname`, `email`, `password`, `type`, `branch_id`, `date_created`) VALUES
(1, 'asma', 'K', 'asma@yahoo.fr', '21232f297a57a5a743894a0e4a801fc3', 1, 0, '2023-11-26 10:57:04'),
(5, 'user', 'ahmed', 'user@yahoo.fr', '21232f297a57a5a743894a0e4a801fc3', 2, 5, '2023-08-02 18:34:44'),
(6, 'Nilesh', 'Chaure', 'n@admin.com', '0192023a7bbd73250516f069df18b500', 2, 6, '2023-08-02 19:47:31'),
(7, 'ahmed', 'K', 'ahmed@gmail.com', 'cd92a26534dba48cd785cdcc0b3e6bd1', 2, 9, '2023-08-03 13:09:32');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `parcels`
--
ALTER TABLE `parcels`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `parcel_tracks`
--
ALTER TABLE `parcel_tracks`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` int(30) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `parcels`
--
ALTER TABLE `parcels`
  MODIFY `id` int(30) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT pour la table `parcel_tracks`
--
ALTER TABLE `parcel_tracks`
  MODIFY `id` int(30) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(30) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(30) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
