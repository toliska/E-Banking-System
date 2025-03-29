import React from 'react';

const Input = ({ label, type, value, onChange }) => {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border rounded px-2 py-1"
      />
    </div>
  );
};

export default Input;
