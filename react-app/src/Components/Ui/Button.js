import React from 'react';

const Button = ({ text, onClick, className = "bg-blue-500 text-white px-4 py-2 rounded" }) => {
  return (
    <button onClick={onClick} className={className}>
      {text}
    </button>
  );
};

export default Button;
