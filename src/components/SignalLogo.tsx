import React from 'react';

interface SignalLogoProps {
  className?: string;
  rounded?: 'rounded-full' | 'rounded-2xl' | 'rounded-xl' | 'rounded-3xl';
}

export const SignalLogo: React.FC<SignalLogoProps> = ({ 
  className = "w-10 h-10",
  rounded = "rounded-2xl" 
}) => {
  return (
    <div className={`relative shrink-0 overflow-hidden flex items-center justify-center bg-[#2C6BED] ${rounded} ${className} shadow-md`}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[85%] h-[85%]"
      >
        {/* Outer Dashed Speech Bubble Ring */}
        <path
          d="M60 14C34.59 14 14 34.59 14 60C14 68.64 16.37 76.73 20.5 83.67L15.35 99.12C14.71 101.04 16.48 102.83 18.41 102.24L34.5 97.47C41.98 102.13 50.72 104.83 60.1 104.83C85.51 104.83 106.1 84.24 106.1 58.83C106.1 33.42 85.51 14 60 14Z"
          stroke="white"
          strokeWidth="6"
          strokeDasharray="9 6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Inner Solid White Speech Bubble */}
        <path
          d="M60 25C40.67 25 25 40.67 25 60C25 66.86 26.97 73.27 30.38 78.69L26.54 90.22C26.07 91.63 27.37 92.94 28.79 92.51L40.7 88.89C46.39 92.44 52.96 94.5 60 94.5C79.33 94.5 95 78.83 95 59.5C95 40.17 79.33 25 60 25Z"
          fill="white"
        />
      </svg>
    </div>
  );
};

export default SignalLogo;
