import { useContext, useEffect, useRef } from "react";
import "./Main.css";
import { AppContext } from "../../context/AppContext";
import MyLoader from "../Loader/Loader";
import { assets } from "../../assets/assets";
import PropTypes from "prop-types";
import ReactMarkdown from 'react-markdown';

const Main = ({ onSent, currentPersona }) => {
  const { Input, setInput, chatHistory, Loading } = useContext(AppContext);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && Input) {
      onSent(Input);
    }
  };

  const handleCardClick = (prompt) => {
    onSent(prompt);
  };

  return (
    <>
      <div className="relative w-[100%] h-[100vh] overflow-hidden">
        <div className="relative bg-red lg:px-5 lg:py-5">
          <nav className="flex bg-red-300 flex-row justify-between mt-8 lg:mt-0">
            <a href="/">
              <h1 className="absolute left-[17vw] mt-1 lg:mt-0 lg:left-[6vw] text-2xl font-semibold">
                <span className="gradient-text">MOCHI.Ai
                {/* <img
                  className="absolute right-5 w-[40px] h-[40px] rounded-full"
                  src={assets.profile}
                  alt="user"
                /> */}
                </span>
              </h1>
            </a>
          </nav>
        </div>

        {chatHistory.length === 0 ? (
          <>
            <div className="greet-cards relative h-32 text-center top-16 lg:top-20">
              <div className="flex flex-col">
                <p id="logo" className="text-[7vh] lg:text-[13vh]">
                  <span className="gradient-text">MOCHI.Ai</span>
                </p>
                <p className="text-[2.6vh] lg:text-[5vh]">
                  Just Breathe, I&apos;m here to listen!
                </p>
              </div>

              <div className="cards h-72 w-[100%] absolute lg:left-[50%] lg:-translate-x-[50%] mt-20 lg:mt-4 flex justify-center items-center flex-wrap gap-2 lg:gap-5">
                <div
                  onClick={() =>
                    handleCardClick("I'm feeling a little overwhelmed today.")
                  }
                  className="card relative transition-all text-start ease-in-out duration-300 bg-[#181B18] hover:bg-[#161816] p-5 h-36 w-36 lg:w-40 lg:h-[26vh] rounded-3xl cursor-pointer"
                >
                  <p className="text-[13px] w-24">
                    I&apos;m feeling a little overwhelmed today.
                  </p>
                </div>
                <div
                  onClick={() =>
                    handleCardClick("Can we talk through a problem I'm facing?")
                  }
                  className="card h-36 w-36 relative transition-all text-start ease-in-out duration-300 bg-[#181B18] hover:bg-[#161816] p-5 lg:w-40 lg:h-[26vh] rounded-3xl cursor-pointer"
                >
                  <p className="text-[13px] w-24">
                    Can we talk through a problem I&apos;m facing?
                  </p>
                </div>
                <div
                  onClick={() =>
                    handleCardClick("Tell me something to feel grateful for.")
                  }
                  className="card relative h-36 w-36 transition-all text-start ease-in-out duration-300 bg-[#181B18] hover:bg-[#161816] p-5 lg:w-40 lg:h-[26vh] rounded-3xl cursor-pointer"
                >
                  <p className="text-[13px] w-24">
                    Tell me something to feel grateful for.
                  </p>
                </div>
                <div
                  onClick={() =>
                    handleCardClick(
                      "Help me practice a simple breathing exercise."
                    )
                  }
                  className="card h-36 w-36 relative transition-all text-start ease-in-out duration-300 bg-[#181B18] hover:bg-[#161816] p-5 lg:w-40 lg:h-[26vh] rounded-3xl cursor-pointer"
                >
                  <p className="text-[13px] w-24">
                    Help me practice a simple breathing exercise.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="result px-5 w-100% h-[71vh] overflow-auto absolute lg:px-72 top-20 lg:top-24 py-2 flex flex-col gap-4">
              {chatHistory.map((message, index) => (
                <div key={index}>
                  <div className="user flex gap-3 items-center">
                    <img
                      className="w-[30px] h-[30px] rounded-full"
                      src={
                        message.role === "user" ? assets.profile : assets.astra
                      }
                      alt={message.role}
                    />
                    <p className="font-bold text-lime-500 text-xl">
                      {message.role === "user" ? "You" : (currentPersona.name || "Mochi")} :
                    </p>
                  </div>
                  <div className="result-data ml-1 flex gap-2">
                    <div className="w-[30px]"></div> {/* Spacer for alignment */}
                    <div className="mt-1 text-zinc-200 w-full"> {/* Apply styling to this container */}
                      <ReactMarkdown>
                        {message.parts[0]}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {Loading && (
                <div className="result-data ml-1 flex gap-2">
                  <img
                    className="w-[30px] h-[30px]"
                    src={assets.astra}
                    alt="Mochi"
                  />
                  <MyLoader className="w-[80%] h-12 lg:h-[124px]" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </>
        )}

        <div className="prompt flex gap-5 absolute bg-[#181B18] left-[50%] -translate-x-[50%] bottom-12 lg:bottom-16 w-[87%] lg:w-[46vw] rounded-full p-3">
          <input
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            value={Input}
            className="w-[90%] ml-3 border-none outline-none bg-transparent text-zinc-200"
            type="text"
            placeholder="Share what's on your mind..."
          />
          {Input && (
            <button onClick={() => onSent(Input)}>
              <img src={assets.send} alt="Send" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

Main.propTypes = {
  onSent: PropTypes.func.isRequired,
  currentPersona: PropTypes.object,
};

export default Main;
