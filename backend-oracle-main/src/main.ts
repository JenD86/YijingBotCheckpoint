import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UserService } from './user/user.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Basic validation setup
  app.useGlobalPipes(new ValidationPipe());

  // Get UserService
  const userService = app.get(UserService);

  // Basic Swagger setup
  const config = new DocumentBuilder()
    .setTitle('I Ching Fortune Telling API')
    .setDescription('I Ching readings and user management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Basic CORS setup
  app.enableCors();

  // Mock user setup
const mockUsername = 'testuser';
const mockUser = await userService.getUser(mockUsername);

if (!mockUser) {
  console.log('Creating mock user...');
  await userService.addPoints(mockUsername, 0);
  const createdMockUser = await userService.getUser(mockUsername);
  console.log('Mock user created:', { 
    id: createdMockUser.id, 
    username: createdMockUser.username, 
    points: createdMockUser.points 
  });
} else {
  console.log('Existing mock user:', { 
    id: mockUser.id, 
    username: mockUser.username, 
    points: mockUser.points 
  });
}

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}

bootstrap().catch((error) => {
  console.error('Bootstrap error:', error);
  process.exit(1);
});