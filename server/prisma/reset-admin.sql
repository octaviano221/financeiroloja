INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `active`, `createdAt`, `updatedAt`)
VALUES (1, 'Loja da Vo', 'admin@suddaiana.com', '$2a$10$AIRQUqypvo.vSvuEQN4Sn.jIWIk2zV2Lx.uNyYKsFwxpJNih34IB.', 'ADMIN', true, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `password` = VALUES(`password`),
  `role` = VALUES(`role`),
  `active` = true,
  `updatedAt` = NOW(3);
