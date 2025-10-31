import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonaAppContext } from '../context/PersonaAppContext';

const CreatePersona = () => {
  // 1. Get both `addCustomPersona` and `setNewlyCreatedPersonaId` from the context
  const { addCustomPersona, setNewlyCreatedPersonaId, setMood } = useContext(PersonaAppContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('Friendly & Casual');

   const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      alert("Please fill in both name and description.");
      return;
    }

    const personaId = 'custom_' + Date.now();
    const newPersona = {
      id: personaId,
      name,
      description,
      tone,
      isCustom: true
    };

    // 2. Save the new persona to your list
    addCustomPersona(newPersona);
    
    // 3. THIS IS THE KEY FIX: Set the ID of the new persona in the context.
    // This tells the PersonaHub which card to highlight.
    setNewlyCreatedPersonaId(personaId);

    // 4. Clear any previous mood selection so the new persona is the *only* recommendation.
    setMood(null);
    
    // 5. Navigate to the chat page to start the conversation immediately.
    navigate(`/chat/${personaId}`, { state: { newPersona: newPersona } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#27272A] text-white p-4">
      <div className="w-full max-w-xl p-8 bg-[#3F3F46] rounded-xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Create Your Persona</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label htmlFor="name" className="block text-zinc-300 mb-2">Persona Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., The Motivator"
              className="w-full p-3 bg-[#27272A] rounded-lg border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#A5FD0B]"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-zinc-300 mb-2">Description / Role</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., A high-energy fitness coach who pushes you to be your best."
              rows="4"
              className="w-full p-3 bg-[#27272A] rounded-lg border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#A5FD0B]"
            />
          </div>
          <div>
            <label htmlFor="tone" className="block text-zinc-300 mb-2">Tone of Voice</label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full p-3 bg-[#27272A] rounded-lg border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#A5FD0B]"
            >
              <option>Friendly & Casual</option>
              <option>Wise & Calm</option>
              <option>Energetic & Upbeat</option>
              <option>Formal & Professional</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full p-3 bg-[#A5FD0B] text-black font-bold rounded-lg hover:bg-lime-400 transition-colors duration-200"
          >
            Start Chatting
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePersona;

