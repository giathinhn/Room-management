import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'md', color = 'accent' }) => {
  return (
    <div className={`spinner spinner--${size} spinner--${color}`} role="status" aria-label="Loading">
      <span className="sr-only">Đang tải...</span>
    </div>
  );
};

export default LoadingSpinner;
