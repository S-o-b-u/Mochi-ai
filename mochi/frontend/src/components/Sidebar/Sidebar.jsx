import { useContext, useState } from "react";
import { Turn as Hamburger } from "hamburger-react";
import { AppContext } from "../../context/AppContext";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import { Link } from "react-router-dom";
import { SignOutButton } from "@clerk/clerk-react";
const Sidebar = () => {
  const [isOpen, setOpen] = useState(false);
  const [extended, setExtended] = useState(false);
  const toggleExtended = () => {
    setExtended((prev) => !prev);
  };

  const { newChat, savedChats, currentChatId, loadChat } =
    useContext(AppContext);

  // Load a complete chat conversation
  const loadChatConversation = (chatId) => {
    loadChat(chatId);
  };

  return (
    <div
      className={`absolute z-50 h-[100VH] bg-[#1d1f21] transition-all ease-in-out duration-[.7s] inline-block ${extended ? "w-64" : "w-0 lg:w-16"
        }`}
    >
      <div className="upper">
        <div className="ml-2 mt-7 lg:mt-3">
          <Hamburger
            onToggle={toggleExtended}
            toggled={isOpen}
            color="#fff"
            toggle={setOpen}
            size={20}
            direction="right"
            rounded
          />
        </div>
        <Link
          to="/personas"
          className={`mt-5 flex bg-[#282a2c] transition-all ease-in hover:bg-[#3e4144] m-2 cursor-pointer rounded-full items-center max-w-36`}
        >
          <img className="p-2" src={assets.persona} alt="Personas" />
          <h1
            className={`font-semibold min-w-24 transition-all ease-in-out delay-[.2s] py-3 duration-[.2s] ${extended ? "opacity-100" : "opacity-0"
              }`}
          >
            Persona
          </h1>
        </Link>
        <div
          onClick={() => newChat()}
          className={`mt-5 flex bg-[#282a2c] transition-all ease-in hover:bg-[#3e4144] m-2 cursor-pointer rounded-full items-center max-w-36`}
        >
          <img className="p-2" src={assets.add} alt="New chat" />
          <h1
            className={`font-semibold min-w-24 transition-all ease-in-out delay-[.2s] py-3 duration-[.2s] ${extended ? "opacity-100" : "opacity-0"
              }`}
          >
            New Chat
          </h1>
        </div>
      </div>

      <div
        className={`animate-fadeIn recents mt-11 m-5 h-[44vh] overflow-auto transition-all ease-linear duration-[.4s] ${extended ? "opacity-100" : "opacity-0 w-0"
          }`}
      >
        <h2 className="mb-4">Recent Chats</h2>

        {savedChats.map((chat) => {
          const isActive = chat.id === currentChatId;
          return (
            <div
              key={chat.id}
              onClick={() => loadChatConversation(chat.id)}
              className={`recent-content text-[#cbc7c7] rounded-full py-2 px-3 flex min-w-36 mb-2 transition-all duration-[.1s] cursor-pointer gap-2 text-sm ${isActive
                ? "bg-[#3e4144] border border-[#555]"
                : "hover:bg-[#2a2c2e]"
                } ${extended
                  ? "delay-300 transition-opacity blur-none opacity-100"
                  : "blur-sm delay-100 transition-all opacity-0"
                }`}
            >
              <img src={assets.recent} alt="" />
              <p title={chat.title}>{chat.title}</p>
            </div>
          );
        })}

        {savedChats.length === 0 && (
          <p className="text-[#888] text-sm italic">No saved chats yet</p>
        )}
      </div>

      <div className="lower m-5 absolute bottom-5 flex flex-col gap-5">
        <a href="https://www.instagram.com/mainhoonshobu/">
          <div className="flex gap-3">
            <img
              className={`transition-all ease-in-out delay-[.2s] duration-[.2s] ${extended ? "opacity-100" : "opacity-0 lg:opacity-100"
                }`}
              src={assets.follow}
              alt=""
            />
            {extended && <h2 className="fade-in">Follow</h2>}
          </div>
        </a>

        <a href="https://github.com/S-o-b-u/AstraGen1/pulls">
          <div className="flex gap-3">
            <img
              className={`transition-all ease-in-out delay-[.2s] duration-[.2s] ${extended ? "opacity-100" : "opacity-0 lg:opacity-100"
                }`}
              src={assets.contri}
              alt=""
            />
            {extended && <h2 className="fade-in">Contribute</h2>}
          </div>
        </a>

        <SignOutButton>
          <div className="flex items-center gap-3 cursor-pointer rounded-lg hover:bg-zinc-700 transition-colors">

            <img
              className="w-6 h-6"
              src={assets.logout}
              alt="Sign Out"
            />

            {extended && <h2 className="fade-in text-red-400 font-bold">Sign Out</h2>}

          </div>
        </SignOutButton>
      </div>
    </div>
  );
};

export default Sidebar;
