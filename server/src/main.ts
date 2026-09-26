import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AgendaModule } from './agenda/agenda.module';

@Module({ imports: [AgendaModule] })
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('FIP Press API')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
