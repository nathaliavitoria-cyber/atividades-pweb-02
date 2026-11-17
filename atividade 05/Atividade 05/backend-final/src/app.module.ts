import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TarefasModule } from './tarefas/tarefas.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { dataSourceOptions } from './data-source';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    // Serve a pasta ./uploads (upload em disco) em /uploads/<arquivo>.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    TarefasModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
