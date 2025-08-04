interface LoadingWidgitProps {
  text: string;
}

const LoadingWidgit = ({
        text
    }:LoadingWidgitProps) => {
    return (
        <div className="flex flex-col items-center justify-center bg-white z-50 w-full h-full">
            <svg
                className="animate-spin h-16 w-16 text-gray-800"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                ></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                ></path>
            </svg>
            <p className="text-2xl font-bold text-gray-900 mt-6">{text}</p>
        </div>
    )
}

export default LoadingWidgit