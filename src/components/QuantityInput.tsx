'use client';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function QuantityInput({
  value,
  onChange,
  min = 0,
  max,
  disabled = false,
  label,
  className = ''
}: QuantityInputProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (!max || value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(min, max ? Math.min(max, newValue) : newValue);
    onChange(clampedValue);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="w-12 h-12 md:w-10 md:h-10 flex items-center justify-center bg-gray-200 text-gray-700 font-bold text-xl rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          −
        </button>

        {/* Number Input */}
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          min={min}
          max={max}
          className="flex-1 text-center px-4 py-3 md:py-2 border-2 border-gray-300 rounded-md text-black text-lg md:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && value >= max)}
          className="w-12 h-12 md:w-10 md:h-10 flex items-center justify-center bg-gray-200 text-gray-700 font-bold text-xl rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>
      
      {/* Min/Max indicator */}
      {(min > 0 || max !== undefined) && (
        <div className="text-xs text-gray-500 mt-1 text-center">
          Range: {min} - {max !== undefined ? max : '∞'}
        </div>
      )}
    </div>
  );
}

