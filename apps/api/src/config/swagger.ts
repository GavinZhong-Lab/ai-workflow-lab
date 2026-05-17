import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './index.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SaaS Platform API',
      version: '1.0.0',
      description: 'AI Workflow Lab - SaaS 基础平台 API 文档',
    },
    servers: [
      { url: `http://localhost:${env.PORT}`, description: '本地开发服务器' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            data: { type: 'object', nullable: true },
            message: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', nullable: true },
            locale: { type: 'string' },
            theme: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        Organization: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            logoUrl: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            orgId: { type: 'string', format: 'uuid' },
          },
        },
        Application: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            key: { type: 'string' },
            description: { type: 'string' },
          },
        },
        Module: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            key: { type: 'string' },
            applicationId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: '认证 - 注册/登录/Token 刷新' },
      { name: 'Users', description: '用户 - 个人信息管理' },
      { name: 'Organizations', description: '组织 - 创建与管理' },
      { name: 'Permissions', description: '权限 - RBAC 权限管理' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
