
import React from 'react';

const TickmillLogo = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <a 
        href="https://my.tickmill.com?utm_campaign=ib_link&utm_content=IB36882052&utm_medium=Open+Account&utm_source=link&lp=https%3A%2F%2Fmy.tickmill.com%2Fen%2Fsign-up" 
        target="_blank" 
        rel="noopener noreferrer"
        className="block hover:opacity-80 transition-opacity duration-200"
      >
        <img 
          alt="Tickmill Logo" 
          src="https://cdn.tickmill.com/promotional/3/logos/2_logo_white_red_120_60.png" 
          width="120" 
          height="60"
          className="drop-shadow-lg"
        />
      </a>
    </div>
  );
};

export default TickmillLogo;
