import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ value, onChange, placeholder = '••••••••', name, required, className = '', ...rest }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        {...rest}
        name={name}
        type={show ? 'text' : 'password'}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-primary text-sm ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
        tabIndex={-1}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
