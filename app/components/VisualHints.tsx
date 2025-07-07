interface VisualHintsProps {
  question: string;
  showingSecondChance: boolean;
  shouldShow: boolean;
}

export function VisualHints({
  question,
  showingSecondChance,
  shouldShow,
}: VisualHintsProps) {
  // Don't render anything if hints shouldn't be shown
  if (!shouldShow) {
    return null;
  }

  // Parse the question to extract numbers and operation
  const additionMatch = question.match(/(\d+)\s*\+\s*(\d+)/);
  const subtractionMatch = question.match(/(\d+)\s*-\s*(\d+)/);

  if (additionMatch) {
    const num1 = parseInt(additionMatch[1], 10);
    const num2 = parseInt(additionMatch[2], 10);
    return <AdditionHint num1={num1} num2={num2} showingSecondChance={showingSecondChance} />;
  } else if (subtractionMatch) {
    const num1 = parseInt(subtractionMatch[1], 10);
    const num2 = parseInt(subtractionMatch[2], 10);
    return <SubtractionHint num1={num1} num2={num2} showingSecondChance={showingSecondChance} />;
  }

  return null;
}

interface AdditionHintProps {
  num1: number;
  num2: number;
  showingSecondChance: boolean;
}

function AdditionHint({ num1, num2, showingSecondChance }: AdditionHintProps) {
  // Create visual dots for each number
  const createDots = (count: number, color: string, emoji: string) => {
    return Array.from({ length: count }, (_, i) => (
      <div 
        key={i} 
        className={`w-10 h-10 rounded-full ${color} border-3 border-white shadow-lg flex items-center justify-center text-lg font-bold text-white animate-pulse`}
        style={{ animationDelay: `${i * 0.1}s` }}
      >
        {emoji}
      </div>
    ));
  };
  
  return (
    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 mb-6 border-3 border-yellow-300 shadow-inner">
      <h3 className="text-2xl font-bold text-gray-700 text-center mb-4">
        {showingSecondChance ? "💡 Let me help you! Let's count together! 💡" : "🌟 Let's count together! 🌟"}
      </h3>
      <div className="flex flex-col items-center space-y-6">
        {/* First number */}
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 mb-3">
            {num1} blue circles! 🔵
          </p>
          <div className="flex justify-center gap-3 flex-wrap max-w-xs">
            {createDots(num1, "bg-blue-500", "●")}
          </div>
        </div>
        
        {/* Plus sign */}
        <div className="text-5xl font-bold text-purple-600 animate-bounce">
          ➕
        </div>
        
        {/* Second number */}
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 mb-3">
            {num2} green circles! 🟢
          </p>
          <div className="flex justify-center gap-3 flex-wrap max-w-xs">
            {createDots(num2, "bg-green-500", "●")}
          </div>
        </div>
        
        {/* Equals */}
        <div className="text-5xl font-bold text-purple-600 animate-bounce" style={{ animationDelay: '0.5s' }}>
          🟰
        </div>
        
        {/* Total dots */}
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600 mb-3">
            Count them all! How many do you see? 🤔
          </p>
          <div className="flex justify-center gap-2 flex-wrap max-w-md bg-white rounded-xl p-4 border-2 border-purple-200">
            {createDots(num1, "bg-blue-500", "●")}
            <div className="w-4"></div>
            {createDots(num2, "bg-green-500", "●")}
          </div>
          <p className="text-lg font-semibold text-gray-600 mt-3">
            👆 Count all the circles above! 👆
          </p>
        </div>
      </div>
    </div>
  );
}

interface SubtractionHintProps {
  num1: number;
  num2: number;
  showingSecondChance: boolean;
}

function SubtractionHint({ num1, num2, showingSecondChance }: SubtractionHintProps) {
  return (
    <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 mb-6 border-3 border-blue-300 shadow-inner">
      <h3 className="text-2xl font-bold text-gray-700 text-center mb-4">
        {showingSecondChance ? "💡 Let me help you! Let's take away! 💡" : "🔢 Let's take away! 🔢"}
      </h3>
      <div className="flex flex-col items-center space-y-6">
        {/* Starting number */}
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 mb-3">
            Start with {num1} blue circles! 🔵
          </p>
          <div className="flex justify-center gap-3 flex-wrap max-w-md bg-white rounded-xl p-4 border-2 border-blue-200">
            {Array.from({ length: num1 }, (_, i) => (
              <div 
                key={i} 
                className="w-10 h-10 rounded-full bg-blue-500 border-3 border-white shadow-lg flex items-center justify-center text-lg font-bold text-white animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                ●
              </div>
            ))}
          </div>
        </div>
        
        {/* Minus sign */}
        <div className="text-5xl font-bold text-red-600 animate-bounce">
          ➖
        </div>
        
        {/* Taking away */}
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600 mb-3">
            Take away {num2} circles! ❌
          </p>
          <div className="flex justify-center gap-3 flex-wrap max-w-md bg-white rounded-xl p-4 border-2 border-red-200">
            {Array.from({ length: num1 }, (_, i) => (
              <div 
                key={i} 
                className={`relative w-10 h-10 rounded-full bg-blue-500 border-3 border-white shadow-lg flex items-center justify-center text-lg font-bold text-white animate-pulse ${i < num2 ? 'opacity-50' : ''}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                ●
                {i < num2 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-1 bg-red-600 rotate-45 rounded"></div>
                    <div className="absolute w-12 h-1 bg-red-600 -rotate-45 rounded"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Equals */}
        <div className="text-5xl font-bold text-purple-600 animate-bounce" style={{ animationDelay: '0.5s' }}>
          🟰
        </div>
        
        {/* Result */}
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 mb-3">
            How many are left? 🤔
          </p>
          <div className="flex justify-center gap-2 flex-wrap max-w-md bg-white rounded-xl p-4 border-2 border-green-200">
            {Array.from({ length: num1 - num2 }, (_, i) => (
              <div 
                key={i} 
                className="w-10 h-10 rounded-full bg-green-500 border-3 border-white shadow-lg flex items-center justify-center text-lg font-bold text-white animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                ●
              </div>
            ))}
          </div>
          <p className="text-lg font-semibold text-gray-600 mt-3">
            👆 Count the remaining circles! 👆
          </p>
        </div>
      </div>
    </div>
  );
}
