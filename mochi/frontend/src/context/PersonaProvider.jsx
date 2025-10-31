import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { PersonaAppContext } from "./PersonaAppContext";

// PersonaProvider.jsx
export const PersonaProvider = ({ children }) => {
  const [customPersonas, setCustomPersonas] = useState(() => {
    const saved = localStorage.getItem("customPersonas");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("customPersonas", JSON.stringify(customPersonas));
  }, [customPersonas]);

  const addCustomPersona = (newPersona) => {
    setCustomPersonas((prev) => [newPersona, ...prev]);
  };

  const [mood, setMood] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [newlyCreatedPersonaId, setNewlyCreatedPersonaId] = useState(null);

  const contextValue = {
    customPersonas,
    addCustomPersona,
    mood,
    setMood, // Expose the setter function
    expandedCardId,
    setExpandedCardId,
    newlyCreatedPersonaId, // Expose the new state
    setNewlyCreatedPersonaId, // Expose its setter
  };

  return (
    <PersonaAppContext.Provider value={contextValue}>
      {children}
    </PersonaAppContext.Provider>
  );
};

PersonaProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
