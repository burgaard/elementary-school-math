import React from "react";

interface KeyboardInputProps {
  correctAnswer: number;
  problemState: 'unanswered' | 'first-wrong' | 'answered';
  canMakeSelection: boolean;
  onChange: (answer: number | null) => void;
  onSubmitAnswer: (answer: number) => void;
}

export function KeyboardInput({
  correctAnswer,
  problemState,
  canMakeSelection,
  onChange,
  onSubmitAnswer
}: KeyboardInputProps) {
  const [value, setValue] = React.useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue(value);
    onChange(/^-?\d+$/.test(value) ? parseInt(value, 10) : null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canMakeSelection && value !== "") {
      onSubmitAnswer(parseInt(value, 10));
    }
  };

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <label htmlFor="answer-input" className="block text-2xl font-semibold text-gray-700 mb-4">
          Type your answer:
        </label>
        <input
          id="answer-input"
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={!canMakeSelection}
          placeholder="?"
          className={`w-48 h-20 text-4xl font-bold text-center border-4 rounded-2xl transition-all duration-200 placeholder:text-xl placeholder:text-gray-400 ${
            problemState === 'answered'
              ? value !== "" && parseInt(value, 10) === correctAnswer
                ? "bg-green-100 border-green-500 text-green-800"
                : "bg-red-100 border-red-500 text-red-800"
              : "bg-white text-gray-800 border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200"
          }`}
          autoFocus
        />
        {canMakeSelection && value !== "" && (
          <p className="text-sm text-gray-500 mt-2">
            💡 Press Enter or click Submit to check your answer!
          </p>
        )}
      </div>
      
      {problemState === 'answered' && (
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-2">
            Correct answer: <span className="font-bold text-green-600">{correctAnswer}</span>
          </p>
        </div>
      )}
    </div>
  );
}
