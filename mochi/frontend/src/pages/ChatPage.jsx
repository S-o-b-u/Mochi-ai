import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PersonaAppContext } from '../context/PersonaAppContext';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar/Sidebar';
import Main from '../components/Main/Main';

function ChatPage() {
  const { personaId } = useParams();
  const { customPersonas } = useContext(PersonaAppContext);
  const { onSent, newChat } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [currentPersona, setCurrentPersona] = useState(null);
  const [premadePersonas, setPremadePersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // This ref will help us prevent the infinite loop
  const processedPersonaIdRef = useRef(null);

  // Effect 1: Fetch pre-made personas from your backend API
  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/personas");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        const personasArray = Object.keys(data).map(id => ({ id, ...data[id] }));
        setPremadePersonas(personasArray);
      } catch (error) {
        console.error("Failed to fetch personas:", error);
      }
    };
    fetchPersonas();
  }, []);

  // Effect 2: Determine the current active persona (FIXED to prevent infinite loop)
  useEffect(() => {
    // Only run this logic if the personaId has actually changed.
    if (personaId === processedPersonaIdRef.current) {
      return; 
    }

    if (premadePersonas.length === 0 && !personaId.startsWith('custom_')) {
      return;
    }

    let personaData;
    const newPersonaFromState = location.state?.newPersona;
    const allPersonas = [...premadePersonas, ...customPersonas];

    if (newPersonaFromState && newPersonaFromState.id === personaId) {
      personaData = newPersonaFromState;
    } else {
      personaData = allPersonas.find(p => p.id === personaId);
    }
    
    if (!personaData) {
      navigate('/');
      return;
    }

    setCurrentPersona(personaData);
    setIsLoading(false);
    newChat(); // Clear the chat for the new persona

    // Update the ref to the persona we just processed
    processedPersonaIdRef.current = personaId;

  }, [personaId, customPersonas, premadePersonas, navigate, location.state, newChat]);

  const handleSend = (prompt) => {
    if (currentPersona) {
      onSent(prompt, currentPersona);
    }
  };

  if (isLoading || !currentPersona) {
    return <div className="min-h-screen bg-[#27272A] text-white flex items-center justify-center">Loading persona...</div>;
  }

  return (
    <div className="flex w-full h-screen bg-[#27272A]">
      <Sidebar />
      <Main onSent={handleSend} currentPersona={currentPersona} />
    </div>
  );
}

export default ChatPage;

