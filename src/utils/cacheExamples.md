# Centralized Cache Invalidation Examples

This document shows how to use the centralized cache invalidation system to reduce boilerplate and ensure consistent cache management.

## Quick Reference

```typescript
import { useCacheManager } from '../hooks/useCacheManager';

const { afterInteraction, afterQuestionCreate, afterUserUpdate, afterEventUpdate } = useCacheManager();
```

## Usage Examples

### 1. After Interaction (Upvote, Me Too, Bookmark)

**Before (Boilerplate):**
```typescript
const queryClient = useQueryClient();

// In mutation success callback
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['questions'] });
  queryClient.invalidateQueries({ queryKey: ['interactions'] });
}
```

**After (Centralized):**
```typescript
const { afterInteraction } = useCacheManager();

// In mutation success callback
onSuccess: () => {
  afterInteraction(questionId);
}
```

### 2. After Question Creation

**Before (Boilerplate):**
```typescript
const queryClient = useQueryClient();

// After creating question
queryClient.invalidateQueries({ queryKey: ['questions'] });
// Maybe also invalidate events if event-specific
```

**After (Centralized):**
```typescript
const { afterQuestionCreate } = useCacheManager();

// After creating question
afterQuestionCreate(eventId); // eventId is optional
```

### 3. Advanced Usage with Full Cache Manager

```typescript
const { cache } = useCacheManager();

// Complex invalidation scenarios
cache.invalidateQuestionInteractions(questionId);
cache.invalidateQuestionData(questionId, { eventId });
cache.invalidateAll(); // Use sparingly
```

### 4. Component Examples

#### QuestionCard Component
```typescript
import { useCacheManager } from '../hooks/useCacheManager';

export const QuestionCard = ({ question }) => {
  const { afterInteraction } = useCacheManager();
  
  const handleUpvote = () => {
    createInteractionMutation.mutate({
      data: { /* interaction data */ }
    }, {
      onSuccess: () => {
        afterInteraction(question.id); // ✅ Simple and consistent
        toast({ title: "Question uplifted!" });
      }
    });
  };
};
```

#### CreateQuestion Component
```typescript
import { useCacheManager } from '../hooks/useCacheManager';

export const CreateQuestion = () => {
  const { afterQuestionCreate } = useCacheManager();
  
  const handleSubmit = async () => {
    await createQuestions();
    
    const eventId = selectedEvents.length === 1 ? selectedEvents[0] : undefined;
    afterQuestionCreate(eventId); // ✅ Handles all relevant caches
    
    navigate('/home');
  };
};
```

## Benefits

1. **Reduced Boilerplate**: One line instead of multiple `invalidateQueries` calls
2. **Consistency**: Same invalidation logic across all components
3. **Maintainability**: Cache logic centralized in one place
4. **Flexibility**: Both quick utilities and advanced cache manager available
5. **Type Safety**: TypeScript support for all functions and options

## Cache Invalidation Patterns

| Action | Function | What Gets Invalidated |
|--------|----------|----------------------|
| Upvote/Me Too/Bookmark | `afterInteraction(questionId)` | Questions + Interactions |
| Create Question | `afterQuestionCreate(eventId?)` | Questions + Interactions + Events (if eventId) |
| Update User | `afterUserUpdate(userId)` | Users + Questions (user data in questions) |
| Update Event | `afterEventUpdate(eventId)` | Events + Questions (event data in questions) |

## Migration Guide

1. Import `useCacheManager` instead of `useQueryClient`
2. Replace manual `invalidateQueries` calls with appropriate utility functions
3. Remove boilerplate cache invalidation code
4. Use the pattern that matches your use case (quick utilities vs full cache manager)