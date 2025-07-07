interface LevelHeaderProps {
  user: {
    id: string;
    avatar: string;
  };
  level: {
    name: string;
    problems: Array<any>;
  };
  currentProblemIndex: number;
  score: number;
  totalAnswered: number;
  accuracy: number;
  progressPercentage: number;
}

export function LevelHeader({
  user,
  level,
  currentProblemIndex,
  score,
  totalAnswered,
  accuracy,
  progressPercentage,
}: LevelHeaderProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{user.avatar}</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{level.name}</h1>
            <p className="text-gray-600">Problem {currentProblemIndex + 1} of {level.problems.length}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-800">Score: {score}/{totalAnswered}</div>
          <div className="text-sm text-gray-600">{accuracy}% accuracy</div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-3">
        <div 
          className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}
