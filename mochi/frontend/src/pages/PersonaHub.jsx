import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { PersonaAppContext } from "../context/PersonaAppContext";

const PersonaCard = ({ to, name, tag, description, isRecommended, id }) => {
  const { expandedCardId, setExpandedCardId } = useContext(PersonaAppContext);

  const isExpanded = expandedCardId === id;

  const handleRightClick = (e) => {
    e.preventDefault();
    setExpandedCardId(isExpanded ? null : id); // toggle expand/collapse
  };

  return (
    <Link to={to} className="flex">
      <div
        onContextMenu={handleRightClick}
        className={`p-6 bg-[#323236] rounded-xl hover:bg-[#3a3a40] cursor-pointer transition-all duration-300 ease-in-out w-full flex flex-col ${
          isExpanded ? "h-auto" : "h-48"
        } ${isRecommended ? "ring-2 ring-[#A5FD0B]" : "ring-0"}`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="relative">
            <h3 className="text-xl font-bold text-white">{name}</h3>
            <div className="w-full h-1 bg-[#A5FD0B] mt-1 rounded-full opacity-90"></div>
          </div>
          {tag && (
            <span className="text-xs shadow-sm font-semibold bg-zinc-400/10 text-[#2bfd60] px-2 py-1 rounded-full flex-shrink-0">
              {tag}
            </span>
          )}
        </div>
        <p className={`text-zinc-400 mt-2 ${!isExpanded && "line-clamp-3"}`}>
          {description}
        </p>
      </div>
    </Link>
  );
};

PersonaCard.propTypes = {
  id: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  tag: PropTypes.string,
  description: PropTypes.string.isRequired,
  isRecommended: PropTypes.bool.isRequired,
};

const PersonaHub = () => {
  const {
    mood,
    customPersonas,
    newlyCreatedPersonaId,
    setNewlyCreatedPersonaId,
  } = useContext(PersonaAppContext);
  // --- NEW STATE FOR FETCHED DATA ---
  
  const [premadePersonas, setPremadePersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  let recommendedPersonaId = null;
  let recommendationText = "";

  if (newlyCreatedPersonaId) {
    recommendedPersonaId = newlyCreatedPersonaId;
  } else if (mood) {
    if (mood === "sad") recommendedPersonaId = "mochi";
    else if (mood === "overwhelmed") recommendedPersonaId = "sukun";
    else if (mood === "curious" || mood === "motivated")
      recommendedPersonaId = "diya";
  }

  if (recommendedPersonaId) {
    const allPersonas = [...customPersonas, ...premadePersonas];
    const recommendedPersona = allPersonas.find(
      (p) => p.id === recommendedPersonaId
    );
    if (recommendedPersona) {
      if (newlyCreatedPersonaId) {
        recommendationText = `Let's start with your new creation, ${recommendedPersona.name}!`;
      } else {
        recommendationText = `Because you're feeling ${mood}, we recommend starting with ${recommendedPersona.name}.`;
      }
    }
  }

  // This effect clears the 'newly created' status after it has been used once.
  useEffect(() => {
    if (newlyCreatedPersonaId) {
      const timer = setTimeout(() => setNewlyCreatedPersonaId(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [newlyCreatedPersonaId, setNewlyCreatedPersonaId]);

  // --- NEW DATA FETCHING LOGIC ---
  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/personas");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();

        // Convert the object from the backend into an array we can map over
        const personasArray = Object.keys(data).map((id) => ({
          id: id,
          ...data[id],
        }));
        setPremadePersonas(personasArray);
      } catch (error) {
        console.error("Failed to fetch personas:", error);
        // You could set a default list here as a fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonas();
  }, []); // Empty array ensures this runs only once when the component mounts

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#27272A] text-white flex items-center justify-center">
        Loading companions...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#27272A] text-white p-6">
      <h1 className="text-4xl font-bold mb-4">Choose Your Companion</h1>
      <p className="text-zinc-400 text-lg mb-10">
        {recommendationText || "Select a companion to begin."}
      </p>
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customPersonas.map((persona) => (
          <PersonaCard
            key={persona.id}
            id={persona.id} // NEW
            to={`/chat/${persona.id}`}
            name={`✨ ${persona.name}`}
            tag="Custom"
            description={persona.description}
            isRecommended={false}
          />
        ))}

        {premadePersonas.map((persona) => (
          <PersonaCard
            key={persona.id}
            id={persona.id} // NEW
            to={`/chat/${persona.id}`}
            name={persona.name}
            tag={persona.tag}
            description={persona.description}
            isRecommended={
              (mood === "sad" && persona.id === "mochi") ||
              (mood === "overwhelmed" && persona.id === "sukun") ||
              ((mood === "curious" || mood === "motivated") &&
                persona.id === "diya")
            }
          />
        ))}
        <div className="md:col-span-2 lg:grid-cols-3">
          <PersonaCard
            id="create-new"
            to="/create-persona"
            name="✍️ Create Your Own"
            description="Design a custom AI companion tailored exactly to your needs."
            isRecommended={false}
          />
        </div>
      </div>
    </div>
  );
};

export default PersonaHub;
