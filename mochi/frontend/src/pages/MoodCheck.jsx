import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PersonaAppContext } from "../context/PersonaAppContext"; // ✅ import context

const MoodCheck = () => {
  const navigate = useNavigate();
  const [hoveredMood, setHoveredMood] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);

  const { setMood, setNewlyCreatedPersonaId } = useContext(PersonaAppContext);

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    // 2. THIS IS THE FIX: Clear the "newly created" status
    setNewlyCreatedPersonaId(null);
    // 3. Set the new mood
    setMood(mood);
    navigate("/personas");
  };

  const moods = [
    {
      id: "overwhelmed",
      text: "A Little Overwhelmed",
      emoji: "😰",
      color: "from-orange-500/20 to-red-500/20",
      hoverColor: "from-orange-500/30 to-red-500/30",
      border: "border-orange-500/30",
    },
    {
      id: "sad",
      text: "Feeling Sad or Lonely",
      emoji: "😢",
      color: "from-blue-500/20 to-indigo-500/20",
      hoverColor: "from-blue-500/30 to-indigo-500/30",
      border: "border-blue-500/30",
    },
    {
      id: "curious",
      text: "Just Curious",
      emoji: "🤔",
      color: "from-purple-500/20 to-pink-500/20",
      hoverColor: "from-purple-500/30 to-pink-500/30",
      border: "border-purple-500/30",
    },
    {
      id: "motivated",
      text: "Ready for a Pep Talk",
      emoji: "💪",
      color: "from-green-500/20 to-lime-500/20",
      hoverColor: "from-green-500/30 to-lime-500/30",
      border: "border-green-500/30",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#27272A] text-white p-4">
      <div className="flex flex-col items-center">
        {/* Logo */}
        <div className="text-center mb-4 group">
          <h1 className="text-6xl md:text-8xl font-black mb-2 relative">
            <span className="text-[#00FF41] drop-shadow-2xl group-hover:scale-105 transition-transform duration-300 inline-block font-logoFont">
              MOCHI.AI
            </span>
          </h1>
          <div className="w-32 h-1 bg-[#00FF41] mx-auto rounded-full opacity-60"></div>
        </div>

        <p className="text-zinc-400 text-xl md:text-2xl mb-16 font-light tracking-wide text-center max-w-lg">
          A safe space for your thoughts and feelings
        </p>

        <SignedIn>
          <div className="w-full">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                How are you feeling?
              </h2>
              <p className="text-zinc-500 text-lg">
                Choose what resonates with you right now
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood.id)}
                  onMouseEnter={() => setHoveredMood(mood.id)}
                  onMouseLeave={() => setHoveredMood(null)}
                  className={`group relative p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 ${
                    hoveredMood === mood.id ? mood.border : "border-zinc-700/50"
                  } ${
                    selectedMood === mood.id ? "ring-2 ring-lime-400/50" : ""
                  }`}
                  style={{
                    background:
                      hoveredMood === mood.id
                        ? `linear-gradient(135deg, ${mood.hoverColor
                            .replace("from-", "")
                            .replace(" to-", ", ")})`
                        : `linear-gradient(135deg, ${mood.color
                            .replace("from-", "")
                            .replace(" to-", ", ")})`,
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform duration-200">
                      {mood.emoji}
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-lg font-semibold text-white group-hover:text-white transition-colors">
                        {mood.text}
                      </div>
                      {selectedMood === mood.id && (
                        <div className="text-sm text-lime-400 mt-1 animate-pulse">
                          Selected ✓
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </button>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-zinc-500 text-sm">
                {selectedMood
                  ? "Great choice! Ready to continue your journey?"
                  : "Click any option to continue your journey"}
              </p>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="text-center bg-white/4 backdrop-blur-lg border border-white/30 shadow-xl px-10 py-5 rounded-2xl">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                Ready to begin?
              </h2>
              <p className="text-zinc-400 max-w-md text-lg leading-relaxed">
                Because your thoughts deserve a safe space — with MOCHI.ai!
              </p>
            </div>
            <SignInButton mode="modal">
              <button className="group relative px-5 py-2 bg-[#00FF41] text-lg rounded-2xl hover:shadow-2xl hover:shadow-lime-900/5 transition-all duration-500 transform hover:scale-100 hover:-translate-y-1">
                <span className="relative z-10 text-zinc-800 font-extrabold">
                  Let’s Glow →
                </span>
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="fixed bottom-4 right-4 px-4 py-2 bg-zinc-800/80 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700/80 transition-colors"
      >
        Refresh Demo
      </button>
    </div>
  );
};

export default MoodCheck;
