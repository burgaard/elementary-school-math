# First Line to Last Mile with Kim

This repository contains the project vibe coded in episodes of the YouTube channel [First Line to Last Mile with Kim](https://www.youtube.com/channel/UC3-Od8EcXPvafhk7r_MGcyA).

You can follow along the changes made in each episode using the [release tags]( https://github.com/burgaard/elementary-school-math/releases).

# 🧮 Math Adventure App 🚀

A fun and engaging math learning platform designed specifically for elementary school children (Kindergarten through 5th grade). Children can create colorful profiles with emoji avatars and progress through grade-appropriate math challenges!

## ✨ Features

- **�👧 Child-Friendly Profiles**: Choose from 20 emoji avatars and create personalized learning profiles
- **📚 Grade-Based Learning**: Math problems tailored for K-5 with progressive difficulty
- **🎯 Progress Tracking**: 80% accuracy required to advance to the next level
- **🎨 Colorful UI**: Engaging design with bright colors, animations, and encouraging feedback
- **📊 Performance Analytics**: Track accuracy, attempts, and completion status
- **🏆 Achievement System**: Complete levels to unlock new challenges

## 🛠 Tech Stack

- **Framework**: Remix with TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Deployment**: Node.js compatible

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm

### Installation

1. Clone the repository:
```sh
git clone <your-repo-url>
cd math-app
```

2. Install dependencies:
```sh
npm install
```

3. Set up the database:
```sh
npx prisma generate
npx prisma db push
npm run db:seed
```

4. Start the development server:
```sh
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## 📖 How to Use

1. **Choose Your Character**: Select an emoji avatar from the home screen
2. **Create Profile**: Enter your name and select your grade level
3. **Start Learning**: Begin with addition problems appropriate for your grade
4. **Progress Through Levels**: Complete levels with 80% accuracy to advance
5. **Track Your Journey**: View your progress and completed levels on the dashboard

## 🎓 Educational Approach

- **Grade-Appropriate Content**: 
  - Kindergarten: Numbers 1-5
  - 1st Grade: Numbers 1-10
  - 2nd Grade: Numbers 1-20
  - 3rd Grade: Numbers 1-50
  - 4th Grade: Numbers 1-100
  - 5th Grade: Numbers 1-200

- **Problem Types**: Currently supports addition and subtraction with plans for multiplication and division
- **Learning Methodology**: Immediate feedback, positive reinforcement, and mastery-based progression

## 🏗 Database Schema

- **Users**: Store child profiles (name, avatar, grade)
- **Levels**: Grade-specific learning challenges
- **Problems**: Math questions with multiple choice answers
- **UserProgress**: Track completion and performance
- **UserAttempts**: Record individual problem-solving attempts

## 🚀 Development

Run the development server:
```sh
npm run dev
```

Build for production:
```sh
npm run build
```

Start production server:
```sh
npm start
```

## 🤝 Contributing

This project is designed with child safety and educational effectiveness in mind. When contributing:

- Maintain child-friendly language and design
- Ensure grade-appropriate content difficulty
- Test thoroughly with the target age group in mind
- Follow accessibility best practices

## 📄 License

This project is licensed under the MIT License.

## 🎯 Future Enhancements

- Multiplication and division problems
- Timed challenges
- Parent/teacher dashboard
- Achievement badges
- Sound effects and animations
- Adaptive difficulty based on performance

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.
