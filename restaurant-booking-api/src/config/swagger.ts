import swaggerJsdoc from 'swagger-jsdoc';
import { APP_NAME } from '../utils/constants';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: APP_NAME,
      version: '1.0.0',
      description: 'API documentation for the restaurant booking system'
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`
      }
    ]
  },
  apis: ['src/routes/*.ts', 'src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
