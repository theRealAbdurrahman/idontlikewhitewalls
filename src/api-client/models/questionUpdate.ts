/**
 * Generated by orval v7.10.0 🍺
 * Do not edit manually.
 * Meetball API
 * API for Meetball - The Summeet's event networking platform
 * OpenAPI spec version: 0.1.0
 */
import type { QuestionUpdateIsOfficial } from './questionUpdateIsOfficial';
import type { QuestionUpdateIsAnonymous } from './questionUpdateIsAnonymous';
import type { QuestionUpdateIsFeatured } from './questionUpdateIsFeatured';

export interface QuestionUpdate {
  title: string;
  content: string;
  is_official: QuestionUpdateIsOfficial;
  is_anonymous: QuestionUpdateIsAnonymous;
  is_featured: QuestionUpdateIsFeatured;
}
