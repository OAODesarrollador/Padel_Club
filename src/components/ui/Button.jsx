export function Button({ children, className = "", variant = "primary", ...props }) {
  const variants = {
    primary: "btn btn-success btn-cta",
    secondary: "btn btn-primary",
    ghost: "btn btn-outline-primary",
    danger: "btn btn-danger"
  };

  return (
    <button
      className={`inline-flex items-center justify-center px-4 py-3 text-base transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
