INSERT IGNORE INTO `User` (`id`, `name`, `email`, `password`, `role`, `active`, `createdAt`, `updatedAt`) VALUES
(1, 'Loja da Vo', 'admin@suddaiana.com', '$2a$10$dj9ru4L6aWaZYVYqE1ojBOn4Uj7hPWSqMoP/9p31naU3uxQARvAJ.', 'ADMIN', true, NOW(3), NOW(3));

INSERT IGNORE INTO `Category` (`id`, `name`, `active`, `createdAt`) VALUES
(1, 'Vestidos', true, NOW(3)),
(2, 'Blusas', true, NOW(3)),
(3, 'Calcas', true, NOW(3)),
(4, 'Infantil', true, NOW(3)),
(5, 'Acessorios', true, NOW(3)),
(6, 'Lingerie', true, NOW(3));

INSERT IGNORE INTO `Brand` (`id`, `name`, `active`, `createdAt`) VALUES
(1, 'Sud Daiana', true, NOW(3)),
(2, 'Flor de Seda', true, NOW(3)),
(3, 'Bella Moda', true, NOW(3));

INSERT IGNORE INTO `Product` (`id`, `name`, `description`, `sku`, `barcode`, `imageUrl`, `costPrice`, `salePrice`, `promoPrice`, `minStock`, `location`, `active`, `onPromotion`, `availableOnline`, `categoryId`, `brandId`, `createdAt`, `updatedAt`) VALUES
(1, 'Vestido Floral Midi', NULL, 'VEST-FLORAL', NULL, 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=600&q=80', 82.50, 189.90, 169.90, 3, 'Arara principal', true, true, true, 1, 1, NOW(3), NOW(3)),
(2, 'Camiseta Basica Feminina', NULL, 'CAM-BASICA', NULL, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80', 28.00, 59.90, NULL, 3, 'Arara principal', true, false, true, 2, 1, NOW(3), NOW(3)),
(3, 'Calca Jeans Skinny', NULL, 'JEANS-SKINNY', NULL, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80', 74.00, 149.90, NULL, 3, 'Arara principal', true, false, true, 3, 1, NOW(3), NOW(3));

INSERT IGNORE INTO `ProductVariant` (`id`, `productId`, `color`, `size`, `sku`, `barcode`, `stock`, `price`, `active`) VALUES
(1, 1, 'Rosa', 'P', 'VEST-FLORAL-RO-P', NULL, 5, NULL, true),
(2, 1, 'Rosa', 'M', 'VEST-FLORAL-RO-M', NULL, 3, NULL, true),
(3, 1, 'Azul', 'G', 'VEST-FLORAL-AZ-G', NULL, 2, NULL, true),
(4, 2, 'Branca', 'P', 'CAM-BR-P', NULL, 12, NULL, true),
(5, 2, 'Preta', 'M', 'CAM-PT-M', NULL, 9, NULL, true),
(6, 2, 'Rosa', 'G', 'CAM-RO-G', NULL, 7, NULL, true),
(7, 3, 'Jeans Claro', '36', 'JEANS-CL-36', NULL, 4, NULL, true),
(8, 3, 'Jeans Escuro', '38', 'JEANS-ES-38', NULL, 6, NULL, true),
(9, 3, 'Jeans Escuro', '40', 'JEANS-ES-40', NULL, 1, NULL, true);

INSERT IGNORE INTO `Customer` (`id`, `name`, `phone`, `cpf`, `email`, `birthDate`, `notes`, `loyaltyPoints`, `address`, `city`, `district`, `createdAt`, `updatedAt`) VALUES
(1, 'Mariana Silva', '11999990000', '12345678901', 'mariana@email.com', NULL, NULL, 248, 'Rua das Flores, 120', 'Sao Paulo', 'Centro', NOW(3), NOW(3));

INSERT IGNORE INTO `StoreConfig` (`id`, `storeName`, `logoUrl`, `cnpj`, `stateRegistration`, `address`, `phone`, `whatsapp`, `email`, `taxRegime`, `fiscalEnvironment`, `loyaltyRate`, `lowStockDefault`, `createdAt`, `updatedAt`) VALUES
(1, 'Sud Daiana Modas', NULL, NULL, NULL, 'Rua da Moda, 100', '(11) 3333-0000', '11999990000', 'contato@suddaiana.com', NULL, 'HOMOLOGACAO', 1, 3, NOW(3), NOW(3));

INSERT IGNORE INTO `Promotion` (`id`, `name`, `type`, `target`, `discountType`, `discountValue`, `minValue`, `startsAt`, `endsAt`, `active`, `createdAt`) VALUES
(1, 'Dia das Maes 20% OFF', 'CATEGORIA', 'Vestidos', 'PERCENTUAL', 20.00, NULL, NOW(3), DATE_ADD(NOW(3), INTERVAL 30 DAY), true, NOW(3)),
(2, 'Cliente Ouro', 'FIDELIDADE', 'OURO', 'VALOR', 25.00, 150.00, NOW(3), DATE_ADD(NOW(3), INTERVAL 60 DAY), true, NOW(3));

INSERT IGNORE INTO `DeliveryOrder` (`id`, `saleId`, `customerId`, `customerName`, `phone`, `address`, `district`, `city`, `reference`, `fee`, `status`, `payment`, `notes`, `createdAt`, `updatedAt`) VALUES
(1, NULL, 1, 'Mariana Silva', '11999990000', 'Rua das Flores, 120', 'Centro', 'Sao Paulo', NULL, 8.00, 'SEPARANDO', 'Pix', 'Enviar mensagem antes de sair.', NOW(3), NOW(3));
