#!/bin/bash

# List of files to update (excluding the ones in providers and stores which should keep useAuthStore)
files=(
  "src/components/Header.tsx"
  "src/components/QuestionCard.tsx"
  "src/screens/Communities.tsx"
  "src/screens/Chat.tsx"
  "src/screens/Events.tsx"
  "src/screens/QuestionDetails.tsx"
  "src/screens/ProfilePage.tsx"
  "src/screens/EventDetails.tsx"
  "src/screens/CreateCommunity.tsx"
)

for file in "${files[@]}"; do
  echo "Updating $file..."
  
  # Replace useAuthStore import with useAuth import
  if grep -q 'import { useAuthStore }' "$file"; then
    # If the file has other imports on the same line, we need to be more careful
    if grep -q 'import {.*useAuthStore.*}.*from.*authStore' "$file"; then
      # Replace just the useAuthStore import
      sed -i '' 's/import { useAuthStore } from "..\/stores\/authStore";/import { useAuth } from "..\/providers";/' "$file"
    fi
  fi
  
  # Replace useAuthStore() calls with useAuth() calls
  # Only replace the destructuring, being careful about what's being destructured
  sed -i '' 's/const { user } = useAuthStore();/const { user } = useAuth();/' "$file"
  sed -i '' 's/const { user, isAuthenticated } = useAuthStore();/const { user, isAuthenticated } = useAuth();/' "$file"
  sed -i '' 's/const { isAuthenticated } = useAuthStore();/const { isAuthenticated } = useAuth();/' "$file"
  
done

echo "File updates complete!"
