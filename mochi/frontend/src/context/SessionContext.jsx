import { useState } from 'react';
import PropTypes from 'prop-types';
import { SessionAppContext } from './SessionAppContext';


// Create the provider component
export const SessionProvider = ({ children }) => {
  const [mood, setMood] = useState(null);
  const [newlyCreatedPersonaId, setNewlyCreatedPersonaId] = useState(null);

  const contextValue = {
    mood,
    setMood,
    newlyCreatedPersonaId,
    setNewlyCreatedPersonaId,
  };

  return (
    <SessionAppContext.Provider value={contextValue}>
      {children}
    </SessionAppContext.Provider>
  );
};

SessionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
