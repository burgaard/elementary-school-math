import type { ActionFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import { db } from "~/lib/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Math Challenge - Solve Problems!" },
    { name: "description", content: "Solve math problems and learn!" },
  ];
};

export const loader: LoaderFunction = async ({ params, request }) => {
  const levelId = params.levelId;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  
  if (!levelId || !userId) {
    throw new Response("Missing required parameters", { status: 400 });
  }

  const level = await db.level.findUnique({
    where: { id: levelId },
    include: {
      problems: true
    }
  });

  if (!level) {
    throw new Response("Level not found", { status: 404 });
  }

  const user = await db.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  // Get existing progress
  const progress = await db.userProgress.findUnique({
    where: {
      userId_levelId: {
        userId,
        levelId
      }
    }
  });

  return json({ level, user, progress });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const action = formData.get("action");
  const userId = formData.get("userId") as string;
  const levelId = formData.get("levelId") as string;
  const problemId = formData.get("problemId") as string;
  const userAnswer = parseInt(formData.get("userAnswer") as string, 10);
  const isSecondAttempt = formData.get("isSecondAttempt") === "true";

  if (action === "submit-answer") {
    // Get the problem to check the answer
    const problem = await db.problem.findUnique({
      where: { id: problemId }
    });

    if (!problem) {
      return json({ error: "Problem not found" }, { status: 404 });
    }

    const isCorrect = userAnswer === problem.answer;

    // Get user to determine grade
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return json({ error: "User not found" }, { status: 404 });
    }

    // Record the attempt in database
    await db.userAttempt.create({
      data: {
        userId,
        problemId,
        userAnswer,
        isCorrect
      }
    });

    // Only update progress if this is a final attempt
    // Final attempt means: correct answer, OR wrong answer for grades 3-5/K, OR second attempt for grades 1-2
    const shouldUpdateProgress = 
      isCorrect || 
      user.grade === 0 || 
      user.grade >= 3 || 
      isSecondAttempt;

    if (shouldUpdateProgress) {
      // Update or create progress
      const existingProgress = await db.userProgress.findUnique({
        where: {
          userId_levelId: {
            userId,
            levelId
          }
        }
      });

      if (existingProgress) {
        const newCorrectAnswers = existingProgress.correctAnswers + (isCorrect ? 1 : 0);
        const newTotalAttempts = existingProgress.totalAttempts + 1;
        
        await db.userProgress.update({
          where: { id: existingProgress.id },
          data: {
            correctAnswers: newCorrectAnswers,
            totalAttempts: newTotalAttempts,
            score: newCorrectAnswers
          }
        });
      } else {
        await db.userProgress.create({
          data: {
            userId,
            levelId,
            correctAnswers: isCorrect ? 1 : 0,
            totalAttempts: 1,
            score: isCorrect ? 1 : 0
          }
        });
      }
    }

    return json({ 
      isCorrect, 
      correctAnswer: problem.answer,
      problemId,
      isFirstWrongFor1st2nd: !isCorrect && (user.grade === 1 || user.grade === 2) && !isSecondAttempt
    });
  }

  if (action === "complete-level") {
    // Check if user has completed enough problems correctly
    const progress = await db.userProgress.findUnique({
      where: {
        userId_levelId: {
          userId,
          levelId
        }
      }
    });

    const level = await db.level.findUnique({
      where: { id: levelId }
    });

    if (progress && level) {
      const accuracy = progress.totalAttempts > 0 ? (progress.correctAnswers / level.problemCount) : 0;
      
      if (accuracy >= 0.8) { // 80% correct
        await db.userProgress.update({
          where: { id: progress.id },
          data: {
            isCompleted: true,
            completedAt: new Date()
          }
        });
        
        return redirect(`/dashboard/${userId}?completed=${levelId}`);
      }
    }

    return json({ needMorePractice: true });
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

export default function Level() {
  const { level, user, progress } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [keyboardAnswer, setKeyboardAnswer] = useState<string>("");
  const [score, setScore] = useState(progress?.correctAnswers || 0);
  const [totalAnswered, setTotalAnswered] = useState(progress?.totalAttempts || 0);
  
  // UI state for attempts and hints
  const [problemState, setProblemState] = useState<'unanswered' | 'first-wrong' | 'answered'>('unanswered');
  const [showingSecondChance, setShowingSecondChance] = useState(false);

  const currentProblem = level.problems[currentProblemIndex];
  const options = JSON.parse(currentProblem.options);
  const isSubmitting = navigation.state === "submitting";
  const useKeyboardInput = user.grade >= 2; // 2nd grade and above use keyboard input
  
  // Determine when to show visual hints
  const shouldShowVisualHints = () => {
    if (user.grade === 0) return true; // Kindergarten always shows hints
    if ((user.grade === 1 || user.grade === 2) && showingSecondChance) return true; // 1st/2nd grade on second chance
    return false;
  };
  
  // Determine when user can make selections
  const canMakeSelection = () => {
    // Kindergarten can always make selections (they always see hints and need to interact)
    if (user.grade === 0) return problemState !== 'answered';
    // Other grades follow normal logic
    return problemState === 'unanswered' || showingSecondChance;
  };

  useEffect(() => {
    if (actionData && "isCorrect" in actionData) {
      if (actionData.isCorrect) {
        setScore((prev: number) => prev + 1);
        setProblemState('answered');
        setShowingSecondChance(false);
        // Update total answered count only if this was a final attempt
        setTotalAnswered((prev: number) => prev + 1);
      } else {
        // Handle wrong answer based on server response
        if ("isFirstWrongFor1st2nd" in actionData && actionData.isFirstWrongFor1st2nd) {
          // First wrong attempt for 1st/2nd grade - offer second chance
          setProblemState('first-wrong');
          // Don't update totalAnswered yet
        } else {
          // Final wrong attempt - either kindergarten, 3rd+ grade, or second attempt
          setProblemState('answered');
          setShowingSecondChance(false);
          // Update total answered count
          setTotalAnswered((prev: number) => prev + 1);
        }
      }
    }
  }, [actionData]);

  const handleNextProblem = () => {
    if (currentProblemIndex < level.problems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setKeyboardAnswer("");
      setProblemState('unanswered');
      setShowingSecondChance(false);
    }
  };

  const handleSelectAnswer = (answer: number) => {
    if (canMakeSelection() && !useKeyboardInput) {
      setSelectedAnswer(answer);
    }
  };

  const handleKeyboardAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and handle negative numbers
    if (value === "" || value === "-" || /^-?\d+$/.test(value)) {
      setKeyboardAnswer(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canMakeSelection() && keyboardAnswer !== "") {
      // Find and submit the form
      const form = e.currentTarget.closest('form') || document.querySelector('form[data-keyboard-form]');
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const getCurrentAnswer = () => {
    if (useKeyboardInput) {
      return keyboardAnswer === "" ? null : parseInt(keyboardAnswer, 10);
    }
    return selectedAnswer;
  };

  // Helper function to render visual hints for kindergarten, 1st, and 2nd grade
  const renderVisualHints = () => {
    // Show visual hints based on our helper function
    if (shouldShowVisualHints()) {
      // Parse the question to extract numbers and operation
      const additionMatch = currentProblem.question.match(/(\d+)\s*\+\s*(\d+)/);
      const subtractionMatch = currentProblem.question.match(/(\d+)\s*-\s*(\d+)/);
      
      if (additionMatch) {
        const num1 = parseInt(additionMatch[1], 10);
        const num2 = parseInt(additionMatch[2], 10);
        return renderAdditionHint(num1, num2);
      } else if (subtractionMatch) {
        const num1 = parseInt(subtractionMatch[1], 10);
        const num2 = parseInt(subtractionMatch[2], 10);
        return renderSubtractionHint(num1, num2);
      }
    }
    return null;
  };

  // Helper function for addition visual hints
  const renderAdditionHint = (num1: number, num2: number) => {
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
  };

  // Helper function for subtraction visual hints
  const renderSubtractionHint = (num1: number, num2: number) => {
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
  };

  const handleTryAgain = () => {
    setProblemState('unanswered');
    setSelectedAnswer(null);
    setKeyboardAnswer("");
    setShowingSecondChance(true);
  };

  const accuracy = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
  const progressPercentage = Math.round(((currentProblemIndex + (problemState === 'answered' ? 1 : 0)) / level.problems.length) * 100);
  const canComplete = totalAnswered >= level.problemCount && accuracy >= 80;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
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

        {/* Problem Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 mb-6 shadow-2xl border border-white/30">
          <div className="text-center mb-8">
            <h2 className="text-6xl font-bold text-gray-800 mb-4">
              {currentProblem.question}
            </h2>
          </div>

          {/* Visual Hints for Kindergarten */}
          {renderVisualHints()}

          {/* Answer Input Section */}
          {useKeyboardInput ? (
            /* Keyboard Input for 2nd-5th Grade */
            <div className="mb-8">
              <div className="text-center mb-6">
                <label htmlFor="answer-input" className="block text-2xl font-semibold text-gray-700 mb-4">
                  Type your answer:
                </label>
                <input
                  id="answer-input"
                  type="text"
                  value={keyboardAnswer}
                  onChange={handleKeyboardAnswerChange}
                  onKeyDown={handleKeyDown}
                  disabled={!canMakeSelection()}
                  placeholder="?"
                  className={`w-48 h-20 text-4xl font-bold text-center border-4 rounded-2xl transition-all duration-200 placeholder:text-xl placeholder:text-gray-400 ${
                    problemState === 'answered'
                      ? keyboardAnswer !== "" && parseInt(keyboardAnswer, 10) === currentProblem.answer
                        ? "bg-green-100 border-green-500 text-green-800"
                        : "bg-red-100 border-red-500 text-red-800"
                      : "bg-white border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200"
                  }`}
                  autoFocus
                />
                {canMakeSelection() && keyboardAnswer !== "" && (
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Press Enter or click Submit to check your answer!
                  </p>
                )}
              </div>
              
              {problemState === 'answered' && (
                <div className="text-center">
                  <p className="text-lg text-gray-600 mb-2">
                    Correct answer: <span className="font-bold text-green-600">{currentProblem.answer}</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Multiple Choice for K-1st Grade */
            <div className="grid grid-cols-2 gap-4 mb-8">
              {options.map((option: number, index: number) => {
                let buttonClass = "w-full p-6 text-3xl font-bold rounded-2xl border-3 transition-all duration-200 ";
                
                if (problemState === 'answered' && !showingSecondChance) {
                  if (option === currentProblem.answer) {
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
                    onClick={() => handleSelectAnswer(option)}
                    disabled={!canMakeSelection()}
                    className={buttonClass}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            {canMakeSelection() && getCurrentAnswer() !== null && (
              <Form method="post" data-keyboard-form>
                <input type="hidden" name="action" value="submit-answer" />
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="levelId" value={level.id} />
                <input type="hidden" name="problemId" value={currentProblem.id} />
                <input type="hidden" name="userAnswer" value={getCurrentAnswer() || ""} />
                <input type="hidden" name="isSecondAttempt" value={showingSecondChance.toString()} />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold py-4 px-8 rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isSubmitting ? "Checking..." : "Submit Answer! ✨"}
                </button>
              </Form>
            )}

            {(problemState === 'answered' || problemState === 'first-wrong') && (
              <div className="space-y-4">
                {actionData && "isCorrect" in actionData ? (
                  <div className={`text-2xl font-bold ${actionData.isCorrect ? "text-green-600" : "text-red-600"}`}>
                    {actionData.isCorrect && "🎉 Correct! Great job!"}
                    {!actionData.isCorrect && problemState === 'answered' && `❌ Not quite! The answer is ${actionData.correctAnswer}`}
                    {!actionData.isCorrect && problemState === 'first-wrong' && "❌ Not quite! Let's try again with some help!"}
                  </div>
                ) : null}

                {/* Show Try Again button for 1st and 2nd grade on first wrong answer */}
                {problemState === 'first-wrong' && (user.grade === 1 || user.grade === 2) && (
                  <button
                    onClick={handleTryAgain}
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-xl font-bold py-4 px-8 rounded-xl hover:from-yellow-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    💡 Try Again with Help! 💡
                  </button>
                )}

                {/* Next Problem button - show if answered (either correct or after second attempt) */}
                {problemState === 'answered' && (
                  currentProblemIndex < level.problems.length - 1 ? (
                    <button
                      onClick={handleNextProblem}
                      className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-xl font-bold py-4 px-8 rounded-xl hover:from-green-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Next Problem! 🚀
                    </button>
                  ) : canComplete ? (
                    <Form method="post">
                      <input type="hidden" name="action" value="complete-level" />
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="levelId" value={level.id} />
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold py-4 px-8 rounded-xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        🎯 Complete Level!
                      </button>
                    </Form>
                  ) : (
                    <div className="text-center">
                      <p className="text-lg text-gray-700 mb-4">
                        You need 80% accuracy to complete this level. Keep practicing! 💪
                      </p>
                      <button
                        onClick={() => {
                          setCurrentProblemIndex(0);
                          setSelectedAnswer(null);
                          setKeyboardAnswer("");
                          setProblemState('unanswered');
                          setShowingSecondChance(false);
                        }}
                        className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xl font-bold py-4 px-8 rounded-xl hover:from-orange-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Try Again! 🔄
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center">
          <a
            href={`/dashboard/${user.id}`}
            className="inline-block bg-white/20 backdrop-blur-sm text-white font-medium py-3 px-6 rounded-xl hover:bg-white/30 transition-all duration-200"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
