/**
 * Generated by orval v7.10.0 🍺
 * Do not edit manually.
 * Meetball API
 * API for Meetball - The Summeet's event networking platform
 * OpenAPI spec version: 0.1.0
 */
import type { QuestionReadIsOfficial } from './questionReadIsOfficial';
import type { QuestionReadIsAnonymous } from './questionReadIsAnonymous';
import type { QuestionReadIsFeatured } from './questionReadIsFeatured';
import type { QuestionReadCreatedAt } from './questionReadCreatedAt';
import type { QuestionReadUpdatedAt } from './questionReadUpdatedAt';
import { UserCreate } from '../api-client';

export interface QuestionRead {
  id: string;
  event_id: string;
  user_id: string;
  title: string;
  content: string;
  is_official: QuestionReadIsOfficial;
  is_anonymous: QuestionReadIsAnonymous;
  is_featured: QuestionReadIsFeatured;
  created_at: QuestionReadCreatedAt;
  updated_at: QuestionReadUpdatedAt;
  i_can_help_count: number;
  me_too_count: number;
  uplifts_count: number;
  user: UserCreate
}
