<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Math Adventure App - Copilot Instructions

This is a Remix React application designed as a math learning platform for elementary school children (Kindergarten through 5th grade).

## Project Architecture

- **Framework**: Remix with TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Target Users**: Elementary school children (ages 5-11)

## Key Features

1. **Profile System**: Children select emoji avatars and create profiles with their name and grade level
2. **Grade-based Learning**: Problems are tailored to specific grade levels with increasing difficulty
3. **Progress Tracking**: 80% accuracy required to advance to next level
4. **Friendly UI**: Colorful, engaging design with emojis and animations
5. **Problem Types**: Addition and subtraction problems with multiple choice answers

## Database Schema

- **User**: Stores child profiles (name, avatar, grade)
- **Level**: Grade-specific learning levels with problems
- **Problem**: Math questions with multiple choice answers
- **UserProgress**: Tracks completion and scores per level
- **UserAttempt**: Records individual problem attempts

## Design Principles

- **Child-Friendly**: Use bright colors, emojis, and encouraging language
- **Safety**: No personal data collection beyond name and grade
- **Accessibility**: Large buttons, clear text, simple navigation
- **Engagement**: Positive feedback, progress visualization, gamification elements

## Code Style

- Use TypeScript for type safety
- Follow Remix conventions for loaders/actions
- Implement proper error handling
- Use Tailwind for responsive, colorful styling
- Add proper loading states and transitions

## Educational Focus

- Problems should be grade-appropriate
- Provide immediate feedback on answers
- Encourage learning through positive reinforcement
- Track progress to show improvement over time
