import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { join } from 'path';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: join(__dirname, '..', '..', 'data', 'telegram-webapp.sqlite'),
  entities: [User],
  synchronize: true,
  logging: true,
};