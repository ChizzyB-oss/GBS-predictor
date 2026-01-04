import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  label,
  value,
  onChange,
  placeholder = "Password",
  name = "password",
  required = true
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="
            w-full rounded-lg border border-gray-300
            px-4 py-2 pr-12
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            text-gray-500 hover:text-gray-700
          "
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
}
