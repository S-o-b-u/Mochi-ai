import { useState, useEffect } from "react";
import { AppContext } from "./AppContext";
import PropTypes from "prop-types";

const ContextProvider = (props) => {
  const [savedChats, setSavedChats] = useState(() => {
    const saved = localStorage.getItem('savedChats');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentChatId, setCurrentChatId] = useState(() => {
    return localStorage.getItem('currentChatId') || generateChatId();
  });

  const [isCurrentChatSaved, setIsCurrentChatSaved] = useState(false);

  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem(`chat_${currentChatId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [Input, setInput] = useState("");
  const [RecentPrompt, setRecentPrompt] = useState("");
  const [Loading, setLoading] = useState(false);
  const [ShowResult, setShowResult] = useState(chatHistory.length > 0);

  function generateChatId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  function generateChatTitle(prompt) {
    if (!prompt) return "New Chat";
    return prompt.length > 40 ? prompt.slice(0, 40) + "..." : prompt;
  }

  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(`chat_${currentChatId}`, JSON.stringify(chatHistory));
    }
    setShowResult(chatHistory.length > 0);
  }, [chatHistory, currentChatId]);

  useEffect(() => {
    localStorage.setItem('currentChatId', currentChatId);
  }, [currentChatId]);

  useEffect(() => {
    localStorage.setItem('savedChats', JSON.stringify(savedChats));
  }, [savedChats]);

  const [currentPersona, setCurrentPersona] = useState(() => {
    const saved = localStorage.getItem('currentPersona');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (currentPersona) {
      localStorage.setItem('currentPersona', JSON.stringify(currentPersona));
    }
  }, [currentPersona]);

  const newChat = () => {
    if (chatHistory.length > 0 && !isCurrentChatSaved) {
      const firstUserMessage = chatHistory.find(msg => msg.role === "user");
      const chatTitle = generateChatTitle(firstUserMessage?.parts[0] || "New Chat");
      
      const chatToSave = {
        id: currentChatId,
        title: chatTitle,
        messages: [...chatHistory],
        timestamp: Date.now()
      };

      setSavedChats(prev => {
        const exists = prev.some(chat => chat.id === currentChatId);
        if (!exists) {
          return [chatToSave, ...prev].slice(0, 50);
        }
        return prev;
      });
    }

    const newChatId = generateChatId();
    setCurrentChatId(newChatId);
    setChatHistory([]);
    setIsCurrentChatSaved(false);
    setLoading(false);
    setInput("");
    setRecentPrompt("");
  };

  const loadChat = (chatId) => {
    if (chatHistory.length > 0 && !isCurrentChatSaved && currentChatId !== chatId) {
      const firstUserMessage = chatHistory.find(msg => msg.role === "user");
      const chatTitle = generateChatTitle(firstUserMessage?.parts[0] || "New Chat");
      
      const chatToSave = {
        id: currentChatId,
        title: chatTitle,
        messages: [...chatHistory],
        timestamp: Date.now()
      };

      setSavedChats(prev => {
        const exists = prev.some(chat => chat.id === currentChatId);
        if (!exists) {
          return [chatToSave, ...prev].slice(0, 50);
        }
        return prev;
      });
    }

    const selectedChat = savedChats.find(chat => chat.id === chatId);
    if (selectedChat) {
      setCurrentChatId(chatId);
      setChatHistory(selectedChat.messages);
      setIsCurrentChatSaved(true);
      
      const lastUserMessage = selectedChat.messages
        .filter(msg => msg.role === "user")
        .pop();
      if (lastUserMessage) {
        setRecentPrompt(lastUserMessage.parts[0]);
      }
    }
  };

  const onSent = async (prompt, personaObject = null) => {
    const persona = personaObject || currentPersona;
    
    if (!persona) {
      console.error("No persona available for chat");
      setChatHistory((prev) => [
        ...prev,
        { role: "model", parts: ["Please select a persona first to start chatting."] },
      ]);
      return;
    }

    setLoading(true);
    const promptToSend = prompt !== undefined ? prompt : Input;
    setInput("");
    setRecentPrompt(promptToSend);

    const userMessage = { role: "user", parts: [promptToSend] };
    const newHistoryWithUserMessage = [...chatHistory, userMessage];
    const aiPlaceholder = { role: "model", parts: [""] };
    setChatHistory([...newHistoryWithUserMessage, aiPlaceholder]);

    if (isCurrentChatSaved) {
      setIsCurrentChatSaved(false);
    }

    let personaForPayload = {};
    if (persona.id === 'custom') {
      // For custom personas, include all the details
      personaForPayload = {
        id: 'custom',
        name: persona.name,
        description: persona.description,
        tone: persona.tone
      };
    } else {
      // For pre-made personas, we only need the ID
      personaForPayload = { id: persona.id };
    }

    const apiPayload = {
      message: promptToSend,
      persona: personaForPayload, // Use the correctly constructed object
      chatHistory: newHistoryWithUserMessage.slice(-8).map(msg => ({
        // Ensure parts is an array of strings
        role: msg.role,
        parts: Array.isArray(msg.parts) ? msg.parts : [String(msg.parts)]
      })),
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload), // Send the final, correct payload
      });

      if (!response.body) throw new Error("Response body is null.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      setLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setChatHistory((prev) => {
          const lastMessage = prev[prev.length - 1];
          const updatedContent = lastMessage.parts[0] + chunk;
          const updatedLastMessage = { ...lastMessage, parts: [updatedContent] };
          return [...prev.slice(0, -1), updatedLastMessage];
        });
      }
    } catch (error) {
      console.error("Streaming failed:", error);
      setChatHistory((prev) => [
        ...prev.slice(0, -1),
        { role: "model", parts: ["Oops! Something went wrong."] },
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCurrentChatSaved && chatHistory.length > 0) {
      setSavedChats(prev => {
        return prev.map(chat => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              messages: [...chatHistory],
              timestamp: Date.now()
            };
          }
          return chat;
        });
      });
    }
  }, [chatHistory, currentChatId, isCurrentChatSaved]);

  const contextValue = {
    Input,
    setInput,
    RecentPrompt,
    setRecentPrompt: setRecentPrompt,
    Loading,
    onSent,
    newChat,
    chatHistory,
    ShowResult,
    
    savedChats,
    currentChatId,
    loadChat,
    isCurrentChatSaved,
    
    currentPersona,
    setCurrentPersona,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {props.children}
    </AppContext.Provider>
  );
};

ContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ContextProvider;