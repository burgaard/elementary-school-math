import type { ActionFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import { db } from "~/lib/db.server";
import { z } from "zod";

export const meta: MetaFunction = () => {
  return [
    { title: "Create Your Profile - Math Adventure" },
    { name: "description", content: "Create your math learning profile" },
  ];
};

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(20, "Name must be 20 characters or less"),
  grade: z.string().transform(val => parseInt(val, 10)),
  avatar: z.string().min(1, "Avatar is required")
});

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const avatar = url.searchParams.get("avatar");
  
  if (!avatar) {
    return redirect("/");
  }
  
  return json({ avatar });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const grade = formData.get("grade");
  const avatar = formData.get("avatar");

  try {
    const validatedData = createUserSchema.parse({ name, grade, avatar });
    
    const user = await db.user.create({
      data: {
        name: validatedData.name,
        grade: validatedData.grade,
        avatar: validatedData.avatar
      }
    });

    return redirect(`/dashboard/${user.id}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ 
        errors: error.errors.reduce((acc, err) => {
          acc[err.path[0]] = err.message;
          return acc;
        }, {} as Record<string, string>)
      }, { status: 400 });
    }
    
    return json({ errors: { general: "Something went wrong" } }, { status: 500 });
  }
};

export default function CreateProfile() {
  const { avatar } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Create Your Profile! ✨
          </h1>
          <div className="text-8xl mb-4">{avatar}</div>
          <p className="text-xl text-white/90">
            Great choice! Now tell us about yourself
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/30">
          <Form method="post" className="space-y-6">
            <input type="hidden" name="avatar" value={avatar} />
            
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-lg font-semibold text-gray-700 mb-2">
                What's your name? 👋
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                maxLength={20}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Enter your name"
              />
            </div>

            {/* Grade Field */}
            <div>
              <label htmlFor="grade" className="block text-lg font-semibold text-gray-700 mb-2">
                What grade are you in? 🎒
              </label>
              <select
                id="grade"
                name="grade"
                required
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="">Choose your grade</option>
                <option value="0">Kindergarten 🌱</option>
                <option value="1">1st Grade 🏃</option>
                <option value="2">2nd Grade 🌟</option>
                <option value="3">3rd Grade 🚀</option>
                <option value="4">4th Grade 💫</option>
                <option value="5">5th Grade 🎯</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    Creating Profile...
                  </span>
                ) : (
                  "Start My Math Adventure! 🎯"
                )}
              </button>
            </div>
          </Form>

          {/* Back Button */}
          <div className="text-center mt-6">
            <a
              href="/"
              className="text-gray-600 hover:text-gray-800 font-medium underline"
            >
              ← Choose a different character
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
