import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loader, action } from '../routes/level.$levelId';
import { db } from '~/lib/db.server';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';

// Mock the redirect function
vi.mock('@remix-run/node', async () => {
  const actual = await vi.importActual('@remix-run/node');
  return {
    ...actual,
    redirect: vi.fn(),
  };
});

describe('Level Route Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loader', () => {
    it('should load level, user, and progress data successfully', async () => {
      // Mock data with correct Prisma types
      const mockLevel = {
        id: 'level-1',
        grade: 1,
        levelNumber: 1,
        name: 'Addition Level 1',
        description: 'Basic addition problems',
        problemCount: 5,
        createdAt: new Date(),
        problems: [
          {
            id: 'problem-1',
            levelId: 'level-1',
            question: '2 + 3 = ?',
            answer: 5,
            options: '[3, 4, 5, 6]',
            type: 'addition',
          },
        ],
      };

      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        avatar: '🎓',
        grade: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockProgress = {
        id: 'progress-1',
        userId: 'user-1',
        levelId: 'level-1',
        score: 2,
        totalAttempts: 3,
        correctAnswers: 2,
        isCompleted: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mocks
      vi.mocked(db.level.findUnique).mockResolvedValue(mockLevel);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(db.userProgress.findUnique).mockResolvedValue(mockProgress);

      // Create mock request
      const request = new Request('http://localhost/level/level-1?userId=user-1');
      const params = { levelId: 'level-1' };

      // Call loader
      const result = await loader({ params, request, context: {} } as LoaderFunctionArgs);
      
      // Cast to Response and extract data
      expect(result).toBeInstanceOf(Response);
      const response = result as Response;
      const data = await response.json();

      // Assertions
      expect(db.level.findUnique).toHaveBeenCalledWith({
        where: { id: 'level-1' },
        include: { problems: true },
      });

      expect(data).toMatchObject({
        level: expect.objectContaining({
          id: mockLevel.id,
          grade: mockLevel.grade,
          levelNumber: mockLevel.levelNumber,
          name: mockLevel.name,
          description: mockLevel.description,
          problemCount: mockLevel.problemCount,
          problems: mockLevel.problems,
        }),
        user: expect.objectContaining({
          id: mockUser.id,
          name: mockUser.name,
          avatar: mockUser.avatar,
          grade: mockUser.grade,
        }),
        progress: expect.objectContaining({
          id: mockProgress.id,
          userId: mockProgress.userId,
          levelId: mockProgress.levelId,
          score: mockProgress.score,
          totalAttempts: mockProgress.totalAttempts,
          correctAnswers: mockProgress.correctAnswers,
          isCompleted: mockProgress.isCompleted,
          completedAt: mockProgress.completedAt,
        }),
      });
    });

    it('should throw 400 error when levelId is missing', async () => {
      const request = new Request('http://localhost/level/?userId=user-1');
      const params = {};

      try {
        await loader({ params, request, context: {} } as LoaderFunctionArgs);
        expect.fail('Expected loader to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toBe(400);
      }
    });

    it('should throw 400 error when userId is missing', async () => {
      const request = new Request('http://localhost/level/level-1');
      const params = { levelId: 'level-1' };

      try {
        await loader({ params, request, context: {} } as LoaderFunctionArgs);
        expect.fail('Expected loader to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toBe(400);
      }
    });

    it('should throw 404 error when level is not found', async () => {
      vi.mocked(db.level.findUnique).mockResolvedValue(null);

      const request = new Request('http://localhost/level/invalid-level?userId=user-1');
      const params = { levelId: 'invalid-level' };

      try {
        await loader({ params, request, context: {} } as LoaderFunctionArgs);
        expect.fail('Expected loader to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toBe(404);
      }
    });

    it('should throw 404 error when user is not found', async () => {
      const mockLevel = {
        id: 'level-1',
        grade: 1,
        levelNumber: 1,
        name: 'Addition Level 1',
        description: 'Basic addition problems',
        problemCount: 5,
        createdAt: new Date(),
        problems: [],
      };

      vi.mocked(db.level.findUnique).mockResolvedValue(mockLevel);
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const request = new Request('http://localhost/level/level-1?userId=invalid-user');
      const params = { levelId: 'level-1' };

      try {
        await loader({ params, request, context: {} } as LoaderFunctionArgs);
        expect.fail('Expected loader to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toBe(404);
      }
    });

    it('should load data successfully when progress is null', async () => {
      const mockLevel = {
        id: 'level-1',
        grade: 1,
        levelNumber: 1,
        name: 'Addition Level 1',
        description: 'Basic addition problems',
        problemCount: 5,
        createdAt: new Date(),
        problems: [],
      };

      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        avatar: '🎓',
        grade: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.level.findUnique).mockResolvedValue(mockLevel);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(db.userProgress.findUnique).mockResolvedValue(null);

      const request = new Request('http://localhost/level/level-1?userId=user-1');
      const params = { levelId: 'level-1' };

      const result = await loader({ params, request, context: {} } as LoaderFunctionArgs);
      const response = result as Response;
      const data = await response.json();

      expect(data).toMatchObject({
        level: expect.objectContaining({
          id: mockLevel.id,
          grade: mockLevel.grade,
          levelNumber: mockLevel.levelNumber,
          name: mockLevel.name,
          description: mockLevel.description,
          problemCount: mockLevel.problemCount,
          problems: mockLevel.problems,
        }),
        user: expect.objectContaining({
          id: mockUser.id,
          name: mockUser.name,
          avatar: mockUser.avatar,
          grade: mockUser.grade,
        }),
        progress: null,
      });
    });
  });

  describe('action - submit-answer', () => {
    it('should handle correct answer submission for kindergarten', async () => {
      const mockProblem = {
        id: 'problem-1',
        levelId: 'level-1',
        question: '2 + 3 = ?',
        answer: 5,
        options: '[3, 4, 5, 6]',
        type: 'addition',
      };

      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        avatar: '🎓',
        grade: 0, // Kindergarten
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.problem.findUnique).mockResolvedValue(mockProblem);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(db.userAttempt.create).mockResolvedValue({} as any);
      vi.mocked(db.userProgress.findUnique).mockResolvedValue(null);
      vi.mocked(db.userProgress.create).mockResolvedValue({} as any);

      const formData = new FormData();
      formData.append('action', 'submit-answer');
      formData.append('userId', 'user-1');
      formData.append('levelId', 'level-1');
      formData.append('problemId', 'problem-1');
      formData.append('userAnswer', '5');
      formData.append('isSecondAttempt', 'false');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as ActionFunctionArgs);
      const response = result as Response;
      const data = await response.json();

      expect(db.userAttempt.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          problemId: 'problem-1',
          userAnswer: 5,
          isCorrect: true,
        },
      });

      expect(data).toEqual({
        isCorrect: true,
        correctAnswer: 5,
        problemId: 'problem-1',
        isFirstWrongFor1st2nd: false,
      });
    });

    it('should handle wrong answer for 1st grade (first attempt)', async () => {
      const mockProblem = {
        id: 'problem-1',
        levelId: 'level-1',
        question: '2 + 3 = ?',
        answer: 5,
        options: '[3, 4, 5, 6]',
        type: 'addition',
      };

      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        avatar: '🎓',
        grade: 1, // 1st grade
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.problem.findUnique).mockResolvedValue(mockProblem);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(db.userAttempt.create).mockResolvedValue({} as any);

      const formData = new FormData();
      formData.append('action', 'submit-answer');
      formData.append('userId', 'user-1');
      formData.append('levelId', 'level-1');
      formData.append('problemId', 'problem-1');
      formData.append('userAnswer', '4'); // Wrong answer
      formData.append('isSecondAttempt', 'false');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as ActionFunctionArgs);
      const response = result as Response;
      const data = await response.json();

      expect(data).toEqual({
        isCorrect: false,
        correctAnswer: 5,
        problemId: 'problem-1',
        isFirstWrongFor1st2nd: true,
      });
    });

    it('should return 404 when problem is not found', async () => {
      vi.mocked(db.problem.findUnique).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('action', 'submit-answer');
      formData.append('userId', 'user-1');
      formData.append('levelId', 'level-1');
      formData.append('problemId', 'invalid-problem');
      formData.append('userAnswer', '5');
      formData.append('isSecondAttempt', 'false');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as ActionFunctionArgs);
      const response = result as Response;
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: 'Problem not found' });
    });

    it('should handle wrong answer for 1st grade (second attempt)', async () => {
      const mockProblem = {
        id: 'problem-1',
        levelId: 'level-1',
        question: '2 + 3 = ?',
        answer: 5,
        options: '[3, 4, 5, 6]',
        type: 'addition',
      };

      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        avatar: '🎓',
        grade: 1, // 1st grade
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockProgress = {
        id: 'progress-1',
        userId: 'user-1',
        levelId: 'level-1',
        score: 2,
        totalAttempts: 3,
        correctAnswers: 2,
        isCompleted: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.problem.findUnique).mockResolvedValue(mockProblem);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(db.userAttempt.create).mockResolvedValue({} as any);
      vi.mocked(db.userProgress.findUnique).mockResolvedValue(mockProgress);
      vi.mocked(db.userProgress.update).mockResolvedValue({} as any);

      const formData = new FormData();
      formData.append('action', 'submit-answer');
      formData.append('userId', 'user-1');
      formData.append('levelId', 'level-1');
      formData.append('problemId', 'problem-1');
      formData.append('userAnswer', '4'); // Wrong answer
      formData.append('isSecondAttempt', 'true');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as ActionFunctionArgs);
      const response = result as Response;
      const data = await response.json();

      expect(db.userProgress.update).toHaveBeenCalledWith({
        where: { id: 'progress-1' },
        data: {
          correctAnswers: 2,
          totalAttempts: 4,
          score: 2,
        },
      });

      expect(data).toEqual({
        isCorrect: false,
        correctAnswer: 5,
        problemId: 'problem-1',
        isFirstWrongFor1st2nd: false,
      });
    });

    it('should handle wrong answer for 3rd grade (immediate update)', async () => {
      const mockProblem = {
        id: 'problem-1',
        levelId: 'level-1',
        question: '15 + 23 = ?',
        answer: 38,
        options: '[35, 36, 37, 38]',
        type: 'addition',
      };

      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        avatar: '🎓',
        grade: 3, // 3rd grade
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.problem.findUnique).mockResolvedValue(mockProblem);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(db.userAttempt.create).mockResolvedValue({} as any);
      vi.mocked(db.userProgress.findUnique).mockResolvedValue(null);
      vi.mocked(db.userProgress.create).mockResolvedValue({} as any);

      const formData = new FormData();
      formData.append('action', 'submit-answer');
      formData.append('userId', 'user-1');
      formData.append('levelId', 'level-1');
      formData.append('problemId', 'problem-1');
      formData.append('userAnswer', '37'); // Wrong answer
      formData.append('isSecondAttempt', 'false');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as ActionFunctionArgs);
      const response = result as Response;
      const data = await response.json();

      expect(db.userProgress.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          levelId: 'level-1',
          correctAnswers: 0,
          totalAttempts: 1,
          score: 0,
        },
      });

      expect(data).toEqual({
        isCorrect: false,
        correctAnswer: 38,
        problemId: 'problem-1',
        isFirstWrongFor1st2nd: false,
      });
    });

    it('should create new progress when none exists', async () => {
      const mockProblem = {
        id: 'problem-1',
        levelId: 'level-1',
        question: '2 + 3 = ?',
        answer: 5,
        options: '[3, 4, 5, 6]',
        type: 'addition',
      };

      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        avatar: '🎓',
        grade: 0, // Kindergarten
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.problem.findUnique).mockResolvedValue(mockProblem);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(db.userAttempt.create).mockResolvedValue({} as any);
      vi.mocked(db.userProgress.findUnique).mockResolvedValue(null);
      vi.mocked(db.userProgress.create).mockResolvedValue({} as any);

      const formData = new FormData();
      formData.append('action', 'submit-answer');
      formData.append('userId', 'user-1');
      formData.append('levelId', 'level-1');
      formData.append('problemId', 'problem-1');
      formData.append('userAnswer', '5');
      formData.append('isSecondAttempt', 'false');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      await action({ request, params: {}, context: {} } as ActionFunctionArgs);

      expect(db.userProgress.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          levelId: 'level-1',
          correctAnswers: 1,
          totalAttempts: 1,
          score: 1,
        },
      });
    });

    it('should update existing progress', async () => {
      const mockProblem = {
        id: 'problem-1',
        levelId: 'level-1',
        question: '2 + 3 = ?',
        answer: 5,
        options: '[3, 4, 5, 6]',
        type: 'addition',
      };

      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        avatar: '🎓',
        grade: 0, // Kindergarten
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockProgress = {
        id: 'progress-1',
        userId: 'user-1',
        levelId: 'level-1',
        score: 3,
        totalAttempts: 4,
        correctAnswers: 3,
        isCompleted: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.problem.findUnique).mockResolvedValue(mockProblem);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(db.userAttempt.create).mockResolvedValue({} as any);
      vi.mocked(db.userProgress.findUnique).mockResolvedValue(mockProgress);
      vi.mocked(db.userProgress.update).mockResolvedValue({} as any);

      const formData = new FormData();
      formData.append('action', 'submit-answer');
      formData.append('userId', 'user-1');
      formData.append('levelId', 'level-1');
      formData.append('problemId', 'problem-1');
      formData.append('userAnswer', '5');
      formData.append('isSecondAttempt', 'false');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      await action({ request, params: {}, context: {} } as ActionFunctionArgs);

      expect(db.userProgress.update).toHaveBeenCalledWith({
        where: { id: 'progress-1' },
        data: {
          correctAnswers: 4,
          totalAttempts: 5,
          score: 4,
        },
      });
    });

    it('should return 404 when user is not found', async () => {
      const mockProblem = {
        id: 'problem-1',
        levelId: 'level-1',
        question: '2 + 3 = ?',
        answer: 5,
        options: '[3, 4, 5, 6]',
        type: 'addition',
      };

      vi.mocked(db.problem.findUnique).mockResolvedValue(mockProblem);
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('action', 'submit-answer');
      formData.append('userId', 'invalid-user');
      formData.append('levelId', 'level-1');
      formData.append('problemId', 'problem-1');
      formData.append('userAnswer', '5');
      formData.append('isSecondAttempt', 'false');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as ActionFunctionArgs);
      const response = result as Response;
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: 'User not found' });
    });
  });

  describe('action - complete-level', () => {
    it('should return needMorePractice when accuracy is below 80%', async () => {
      const mockProgress = {
        id: 'progress-1',
        userId: 'user-1',
        levelId: 'level-1',
        score: 3,
        totalAttempts: 5,
        correctAnswers: 3,
        isCompleted: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLevel = {
        id: 'level-1',
        grade: 1,
        levelNumber: 1,
        name: 'Addition Level 1',
        description: 'Basic addition problems',
        problemCount: 5,
        createdAt: new Date(),
      };

      vi.mocked(db.userProgress.findUnique).mockResolvedValue(mockProgress);
      vi.mocked(db.level.findUnique).mockResolvedValue(mockLevel);

      const formData = new FormData();
      formData.append('action', 'complete-level');
      formData.append('userId', 'user-1');
      formData.append('levelId', 'level-1');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as ActionFunctionArgs);
      const response = result as Response;
      const data = await response.json();

      expect(data).toEqual({ needMorePractice: true });
      expect(db.userProgress.update).not.toHaveBeenCalled();
    });

    it('should complete level and redirect when accuracy is 80% or higher', async () => {
      const mockProgress = {
        id: 'progress-1',
        userId: 'user-1',
        levelId: 'level-1',
        score: 4,
        totalAttempts: 5,
        correctAnswers: 4,
        isCompleted: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLevel = {
        id: 'level-1',
        grade: 1,
        levelNumber: 1,
        name: 'Addition Level 1',
        description: 'Basic addition problems',
        problemCount: 5,
        createdAt: new Date(),
      };

      const mockRedirect = vi.mocked(redirect);
      mockRedirect.mockImplementation(() => {
        throw new Response(null, { status: 302, headers: { Location: '/dashboard/user-1?completed=level-1' } });
      });

      vi.mocked(db.userProgress.findUnique).mockResolvedValue(mockProgress);
      vi.mocked(db.level.findUnique).mockResolvedValue(mockLevel);
      vi.mocked(db.userProgress.update).mockResolvedValue({} as any);

      const formData = new FormData();
      formData.append('action', 'complete-level');
      formData.append('userId', 'user-1');
      formData.append('levelId', 'level-1');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      await expect(action({ request, params: {}, context: {} } as ActionFunctionArgs))
        .rejects.toThrow();

      expect(db.userProgress.update).toHaveBeenCalledWith({
        where: { id: 'progress-1' },
        data: {
          isCompleted: true,
          completedAt: expect.any(Date),
        },
      });

      expect(mockRedirect).toHaveBeenCalledWith('/dashboard/user-1?completed=level-1');
    });

    it('should return needMorePractice when progress is null', async () => {
      vi.mocked(db.userProgress.findUnique).mockResolvedValue(null);
      vi.mocked(db.level.findUnique).mockResolvedValue({
        id: 'level-1',
        grade: 1,
        levelNumber: 1,
        name: 'Addition Level 1',
        description: 'Basic addition problems',
        problemCount: 5,
        createdAt: new Date(),
      });

      const formData = new FormData();
      formData.append('action', 'complete-level');
      formData.append('userId', 'user-1');
      formData.append('levelId', 'level-1');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as ActionFunctionArgs);
      const response = result as Response;
      const data = await response.json();

      expect(data).toEqual({ needMorePractice: true });
    });

    it('should return needMorePractice when level is null', async () => {
      vi.mocked(db.userProgress.findUnique).mockResolvedValue({
        id: 'progress-1',
        userId: 'user-1',
        levelId: 'level-1',
        score: 4,
        totalAttempts: 5,
        correctAnswers: 4,
        isCompleted: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(db.level.findUnique).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('action', 'complete-level');
      formData.append('userId', 'user-1');
      formData.append('levelId', 'level-1');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as ActionFunctionArgs);
      const response = result as Response;
      const data = await response.json();

      expect(data).toEqual({ needMorePractice: true });
    });
  });

  describe('action - invalid action', () => {
    it('should return 400 error for invalid action', async () => {
      const formData = new FormData();
      formData.append('action', 'invalid-action');

      const request = new Request('http://localhost', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request, params: {}, context: {} } as ActionFunctionArgs);
      const response = result as Response;
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Invalid action' });
    });
  });
});
