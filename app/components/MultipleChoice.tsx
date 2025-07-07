interface MultipleChoiceProps {
  options: number[];
  selectedAnswer: number | null;
  correctAnswer: number;
  problemState: 'unanswered' | 'first-wrong' | 'answered';
  showingSecondChance: boolean;
  canMakeSelection: boolean;
  onSelectAnswer: (answer: number) => void;
}

export function MultipleChoice({
  options,
  selectedAnswer,
  correctAnswer,
  problemState,
  showingSecondChance,
  canMakeSelection,
  onSelectAnswer,
}: MultipleChoiceProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      {options.map((option: number, index: number) => {
        let buttonClass = "w-full p-6 text-3xl font-bold rounded-2xl border-3 transition-all duration-200 ";
        
        if (problemState === 'answered' && !showingSecondChance) {
          if (option === correctAnswer) {
            buttonClass += "bg-green-500 border-green-600 text-white"; // Correct answer
          } else if (option === selectedAnswer) {
            buttonClass += "bg-red-500 border-red-600 text-white"; // Wrong selected answer
          } else {
            buttonClass += "bg-gray-300 border-gray-400 text-gray-600"; // Other options
          }
        } else {
          if (option === selectedAnswer) {
            buttonClass += "bg-blue-500 border-blue-600 text-white shadow-lg transform scale-105";
          } else {
            buttonClass += "bg-white border-gray-300 text-gray-800 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md";
          }
        }

        return (
          <button
            key={index}
            onClick={() => onSelectAnswer(option)}
            disabled={!canMakeSelection}
            className={buttonClass}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
