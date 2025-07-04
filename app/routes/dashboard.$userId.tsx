import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db } from "~/lib/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Math Dashboard - Your Learning Journey" },
    { name: "description", content: "Track your math learning progress" },
  ];
};

export const loader: LoaderFunction = async ({ params }) => {
  const userId = params.userId;
  
  if (!userId) {
    throw new Response("User not found", { status: 404 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      progress: {
        include: {
          level: true
        },
        orderBy: {
          level: {
            levelNumber: 'asc'
          }
        }
      }
    }
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  // Get all levels for the user's grade
  const availableLevels = await db.level.findMany({
    where: {
      grade: user.grade
    },
    orderBy: {
      levelNumber: 'asc'
    }
  });

  return json({ user, availableLevels });
};

function getGradeName(grade: number): string {
  switch (grade) {
    case 0: return "Kindergarten";
    case 1: return "1st Grade";
    case 2: return "2nd Grade";
    case 3: return "3rd Grade";
    case 4: return "4th Grade";
    case 5: return "5th Grade";
    default: return `Grade ${grade}`;
  }
}

function getLevelIcon(levelNumber: number, type: string): string {
  if (type.includes("Addition")) return "➕";
  if (type.includes("Subtraction")) return "➖";
  if (type.includes("Multiplication")) return "✖️";
  if (type.includes("Division")) return "➗";
  return "🧮";
}

export default function Dashboard() {
  const { user, availableLevels } = useLoaderData<typeof loader>();

  const getProgressForLevel = (levelId: string) => {
    return user.progress.find((p: any) => p.levelId === levelId);
  };

  const getNextAvailableLevel = () => {
    // Find the first level that's not completed
    for (const level of availableLevels) {
      const progress = getProgressForLevel(level.id);
      if (!progress || !progress.isCompleted) {
        return level;
      }
    }
    return null; // All levels completed
  };

  const completedLevels = user.progress.filter((p: any) => p.isCompleted).length;
  const totalLevels = availableLevels.length;
  const overallProgress = totalLevels > 0 ? (completedLevels / totalLevels) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-6xl">{user.avatar}</div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-xl text-white/90">
                {getGradeName(user.grade)} Math Adventure
              </p>
            </div>
          </div>
          
          {/* Overall Progress */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mx-auto max-w-md">
            <h3 className="text-white font-semibold mb-2">Overall Progress</h3>
            <div className="bg-white/30 rounded-full h-4 mb-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
            <p className="text-white/90 text-sm">
              {completedLevels} of {totalLevels} levels completed
            </p>
          </div>
        </div>

        {/* Quick Action - Next Level */}
        {(() => {
          const nextLevel = getNextAvailableLevel();
          if (nextLevel) {
            return (
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 mb-8 shadow-2xl border border-white/30">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                  Ready for Your Next Challenge? 🎯
                </h2>
                <div className="text-center">
                  <div className="text-6xl mb-4">{getLevelIcon(nextLevel.levelNumber, nextLevel.name)}</div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">{nextLevel.name}</h3>
                  <p className="text-gray-600 mb-6">{nextLevel.description}</p>
                  <Link
                    to={`/level/${nextLevel.id}?userId=${user.id}`}
                    className="inline-block bg-gradient-to-r from-green-500 to-blue-600 text-white text-xl font-bold py-4 px-8 rounded-xl hover:from-green-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Start Level! 🚀
                  </Link>
                </div>
              </div>
            );
          }
        })()}

        {/* All Levels Overview */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/30">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Your Learning Journey 📚
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableLevels.map((level: any) => {
              const progress = getProgressForLevel(level.id);
              const isCompleted = progress?.isCompleted || false;
              const score = progress?.score || 0;
              const attempts = progress?.totalAttempts || 0;
              const correctAnswers = progress?.correctAnswers || 0;
              const accuracy = attempts > 0 ? Math.round((correctAnswers / attempts) * 100) : 0;
              
              return (
                <div
                  key={level.id}
                  className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                    isCompleted 
                      ? "bg-green-50 border-green-300 shadow-lg" 
                      : "bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{getLevelIcon(level.levelNumber, level.name)}</div>
                      <div>
                        <h3 className="font-bold text-gray-800">{level.name}</h3>
                        <p className="text-sm text-gray-600">{level.problemCount} problems</p>
                      </div>
                    </div>
                    {isCompleted && (
                      <div className="text-3xl">✅</div>
                    )}
                  </div>
                  
                  {progress && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{accuracy}% accuracy</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isCompleted ? "bg-green-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(100, (correctAnswers / level.problemCount) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Link
                      to={`/level/${level.id}?userId=${user.id}`}
                      className={`flex-1 text-center py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                        isCompleted
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isCompleted ? "Review" : "Start"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="text-center mt-8 space-x-4">
          <Link
            to="/"
            className="inline-block bg-white/20 backdrop-blur-sm text-white font-medium py-3 px-6 rounded-xl hover:bg-white/30 transition-all duration-200"
          >
            ← Switch Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
