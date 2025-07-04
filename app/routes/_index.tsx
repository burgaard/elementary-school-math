import type { MetaFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { db } from "~/lib/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Math Adventure - Choose Your Character!" },
    { name: "description", content: "A fun math learning app for elementary school children" },
  ];
};

export const loader: LoaderFunction = async () => {
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  return json({ users });
};

const AVATAR_OPTIONS = [
  "🐶", "🐱", "🐭", "🐰", "🦊", "🐸", "🐼", "🐨", "🦁", "🐯",
  "🦄", "🐹", "🐷", "🐮", "🐧", "🐤", "🦋", "🐙", "🦖", "🌟"
];

export default function Index() {
  const { users } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const handleCreateProfile = (avatar: string) => {
    navigate(`/create-profile?avatar=${avatar}`);
  };

  const handleSelectProfile = (userId: string) => {
    navigate(`/dashboard/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            🧮 Math Adventure! 🚀
          </h1>
          <p className="text-2xl text-white/90 font-medium">
            Choose your character and start learning!
          </p>
        </div>

        {/* Existing Profiles */}
        {users.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Welcome Back! Choose Your Profile
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {users.map((user: any) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectProfile(user.id)}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-4 border-white/50"
                >
                  <div className="text-6xl mb-3">{user.avatar}</div>
                  <div className="text-xl font-bold text-gray-800 mb-1">{user.name}</div>
                  <div className="text-sm text-gray-600">
                    Grade {user.grade === 0 ? 'K' : user.grade}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create New Profile */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Create a New Profile
          </h2>
          <p className="text-white/90 text-center mb-8 text-lg">
            Pick your favorite emoji character!
          </p>
          
          <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-4">
            {AVATAR_OPTIONS.map((avatar, index) => (
              <button
                key={index}
                onClick={() => handleCreateProfile(avatar)}
                className="w-16 h-16 md:w-20 md:h-20 bg-white/90 rounded-2xl flex items-center justify-center text-3xl md:text-4xl hover:bg-white hover:scale-110 transform transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-white/30"
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/70 text-lg">
            Made with ❤️ for young mathematicians
          </p>
        </div>
      </div>
    </div>
  );
}
