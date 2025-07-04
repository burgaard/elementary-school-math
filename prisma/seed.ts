import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to generate mixed addition and subtraction problems
function generateMixedProblems(grade: number, count: number) {
  const problems = [];
  for (let i = 0; i < count; i++) {
    let num1, num2;
    const isAddition = Math.random() > 0.5; // 50/50 chance for addition vs subtraction
    
    switch (grade) {
      case 0: // Kindergarten: 1-5
        num1 = Math.floor(Math.random() * 5) + 1;
        num2 = Math.floor(Math.random() * 5) + 1;
        if (!isAddition && num2 > num1) {
          // Ensure subtraction doesn't go negative for kindergarten
          [num1, num2] = [num2, num1];
        }
        break;
      case 1: // 1st grade: 1-10
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        if (!isAddition && num2 > num1) {
          [num1, num2] = [num2, num1];
        }
        break;
      case 2: // 2nd grade: 1-20
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        if (!isAddition && num2 > num1) {
          [num1, num2] = [num2, num1];
        }
        break;
      case 3: // 3rd grade: 1-50
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        if (!isAddition && num2 > num1) {
          [num1, num2] = [num2, num1];
        }
        break;
      case 4: // 4th grade: 1-100
        num1 = Math.floor(Math.random() * 100) + 1;
        num2 = Math.floor(Math.random() * 100) + 1;
        if (!isAddition && num2 > num1) {
          [num1, num2] = [num2, num1];
        }
        break;
      default: // 5th grade: 1-200
        num1 = Math.floor(Math.random() * 200) + 1;
        num2 = Math.floor(Math.random() * 200) + 1;
        if (!isAddition && num2 > num1) {
          [num1, num2] = [num2, num1];
        }
    }
    
    const answer = isAddition ? num1 + num2 : num1 - num2;
    const operation = isAddition ? '+' : '-';
    const type = isAddition ? 'addition' : 'subtraction';
    
    // Generate wrong answers
    const wrongAnswers = [
      Math.max(0, answer + Math.floor(Math.random() * 5) + 1),
      Math.max(0, answer - Math.floor(Math.random() * 5) - 1),
      Math.max(0, answer + Math.floor(Math.random() * 10) + 5)
    ];
    
    const options = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    
    problems.push({
      question: `${num1} ${operation} ${num2} = ?`,
      answer,
      options: JSON.stringify(options),
      type
    });
  }
  return problems;
}

async function main() {
  console.log('Seeding database...');
  
  // Create levels for each grade
  const grades = [
    { grade: 0, name: 'Kindergarten', problemCount: 5 },
    { grade: 1, name: '1st Grade', problemCount: 10 },
    { grade: 2, name: '2nd Grade', problemCount: 15 },
    { grade: 3, name: '3rd Grade', problemCount: 20 },
    { grade: 4, name: '4th Grade', problemCount: 25 },
    { grade: 5, name: '5th Grade', problemCount: 30 }
  ];

  for (const gradeInfo of grades) {
    if (gradeInfo.grade === 0) {
      // Kindergarten: Keep addition only for simplicity
      const level = await prisma.level.create({
        data: {
          grade: gradeInfo.grade,
          levelNumber: 1,
          name: `${gradeInfo.name} - Addition`,
          description: `Simple addition problems for ${gradeInfo.name}`,
          problemCount: gradeInfo.problemCount
        }
      });

      // Generate pure addition problems for kindergarten
      const problems = [];
      for (let i = 0; i < gradeInfo.problemCount; i++) {
        const num1 = Math.floor(Math.random() * 5) + 1;
        const num2 = Math.floor(Math.random() * 5) + 1;
        const answer = num1 + num2;
        const wrongAnswers = [
          answer + Math.floor(Math.random() * 3) + 1,
          answer - Math.floor(Math.random() * 3) - 1,
          answer + Math.floor(Math.random() * 5) + 3
        ];
        const options = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        problems.push({
          question: `${num1} + ${num2} = ?`,
          answer,
          options: JSON.stringify(options),
          type: 'addition'
        });
      }

      for (const problem of problems) {
        await prisma.problem.create({
          data: {
            ...problem,
            levelId: level.id
          }
        });
      }
    } else {
      // 1st-5th Grade: Mixed operations
      const level = await prisma.level.create({
        data: {
          grade: gradeInfo.grade,
          levelNumber: 1,
          name: `${gradeInfo.name} - Mixed Math`,
          description: `Addition and subtraction problems for ${gradeInfo.name}`,
          problemCount: gradeInfo.problemCount
        }
      });

      // Generate mixed problems
      const mixedProblems = generateMixedProblems(gradeInfo.grade, gradeInfo.problemCount);
      for (const problem of mixedProblems) {
        await prisma.problem.create({
          data: {
            ...problem,
            levelId: level.id
          }
        });
      }
    }

    console.log(`Created level and problems for ${gradeInfo.name}`);
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
