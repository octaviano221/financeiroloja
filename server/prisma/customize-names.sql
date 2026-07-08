UPDATE `User`
SET `name` = 'Administrador Sud Daiana', `updatedAt` = NOW(3)
WHERE `email` = 'admin@suddaiana.com';

UPDATE `Category` SET `name` = 'Calças' WHERE `name` = 'Calcas';
UPDATE `Category` SET `name` = 'Acessórios' WHERE `name` = 'Acessorios';

UPDATE `Product` SET `name` = 'Camiseta Básica Feminina', `updatedAt` = NOW(3)
WHERE `sku` = 'CAM-BASICA';

UPDATE `Product` SET `name` = 'Calça Jeans Skinny', `updatedAt` = NOW(3)
WHERE `sku` = 'JEANS-SKINNY';

UPDATE `Promotion` SET `name` = 'Dia das Mães 20% OFF'
WHERE `name` = 'Dia das Maes 20% OFF';
