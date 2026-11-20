import { Injectable } from '@nestjs/common';
import { ChatGateway } from '../chat/chat.gateway';

/**
 * Re-export ChatGateway as OrdersGateway for backward compatibility
 */
export { ChatGateway, ChatGateway as OrdersGateway } from '../chat/chat.gateway';
