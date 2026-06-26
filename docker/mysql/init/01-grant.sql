-- Prisma migrate dev 需要创建 shadow database
GRANT ALL PRIVILEGES ON `aigc`.* TO 'aigc'@'%';
GRANT CREATE, DROP, ALTER, INDEX ON *.* TO 'aigc'@'%';
FLUSH PRIVILEGES;
