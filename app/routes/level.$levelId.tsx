import type { ActionFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, useFetcher, useSubmit } from "@remix-run/react";
import { useState, useEffect } from "react";
import { db } from "~/lib/db.server";
import { LevelHeader } from "~/components/LevelHeader";
import { VisualHints } from "~/components/VisualHints";
import { MultipleChoice } from "~/components/MultipleChoice";
import { KeyboardInput } from "~/components/KeyboardInput";

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
  const submit = useSubmit();
  
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
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
      setAnswer(null);
      setProblemState('unanswered');
      setShowingSecondChance(false);
    }
  };

  const handleSelectAnswer = (answer: number) => {
    if (canMakeSelection() && !useKeyboardInput) {
      setAnswer(answer);
    }
  };

  const handleSubmitAnswer = (answer: number) => {
    const formData = new FormData();
    formData.append("action", "submit-answer");
    formData.append("userId", user.id);
    formData.append("levelId", level.id);
    formData.append("problemId", currentProblem.id);
    formData.append("userAnswer", answer.toString());
    formData.append("isSecondAttempt", showingSecondChance.toString());

    submit(formData, { method: "post" });
  };
  
  const handleTryAgain = () => {
    setProblemState('unanswered');
    setAnswer(null);
    setShowingSecondChance(true);
  };

  const accuracy = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
  const progressPercentage = Math.round(((currentProblemIndex + (problemState === 'answered' ? 1 : 0)) / level.problems.length) * 100);
  const canComplete = totalAnswered >= level.problemCount && accuracy >= 80;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <LevelHeader
          user={user}
          level={level}
          currentProblemIndex={currentProblemIndex}
          score={score}
          totalAnswered={totalAnswered}
          accuracy={accuracy}
          progressPercentage={progressPercentage}
        />

        {/* Problem Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 mb-6 shadow-2xl border border-white/30">
          <div className="text-center mb-8">
            <h2 className="text-6xl font-bold text-gray-800 mb-4">
              {currentProblem.question}
            </h2>
          </div>

          {/* Visual Hints for Kindergarten */}
          <VisualHints
            question={currentProblem.question}
            showingSecondChance={showingSecondChance}
            shouldShow={shouldShowVisualHints()}
          />

          {/* Answer Input Section */}
          {useKeyboardInput ? (
            /* Keyboard Input for 2nd-5th Grade */
            <KeyboardInput
              key={currentProblem.id}
              correctAnswer={currentProblem.answer}
              problemState={problemState}
              canMakeSelection={canMakeSelection()}
              onChange={setAnswer}
              onSubmitAnswer={handleSubmitAnswer}
            />
          ) : (
            /* Multiple Choice for K-1st Grade */
            <MultipleChoice
              options={options}
              selectedAnswer={answer}
              correctAnswer={currentProblem.answer}
              problemState={problemState}
              showingSecondChance={showingSecondChance}
              canMakeSelection={canMakeSelection()}
              onSelectAnswer={handleSelectAnswer}
            />
          )}

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            {canMakeSelection() && answer !== null && (
              <Form method="post" data-keyboard-form>
                <input type="hidden" name="action" value="submit-answer" />
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="levelId" value={level.id} />
                <input type="hidden" name="problemId" value={currentProblem.id} />
                <input type="hidden" name="userAnswer" value={answer.toString()} />
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
                          setAnswer(null);
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
