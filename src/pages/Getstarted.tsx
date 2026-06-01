import React, { useState } from "react";
import { Mail, Lock, User, UserCircle, Eye, EyeOff } from "lucide-react";

const Getstarted: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    agreeTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4 md:p-6 font-sans">
      <div
        className="w-full max-w-[1400px] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col lg:flex-row"
        style={{
          animation: "fadeInUp 0.6s ease-out",
        }}
      >
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeInLeft {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes fadeInRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.8; }
          }
        `}</style>

        {/* LEFT PANEL - Hero Section */}
        <div
          className="relative lg:w-[45%] bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 p-8 md:p-10 flex flex-col justify-between overflow-hidden"
          style={{
            animation: "fadeInLeft 0.6s ease-out 0.1s both",
          }}
        >
          {/* Animated stars/particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full"
                style={{
                  left: Math.random() * 100 + "%",
                  top: Math.random() * 100 + "%",
                  animation: `twinkle ${3 + Math.random() * 4}s infinite ${Math.random() * 5}s`,
                }}
              />
            ))}
          </div>

          {/* Logo */}
          <div
            className="relative z-10"
            style={{
              animation: "fadeInLeft 0.6s ease-out 0.2s both",
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-white font-semibold text-xl tracking-tight">
                Astro
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
            <h1
              className="text-white text-4xl md:text-5xl font-bold leading-tight mb-6"
              style={{
                animation: "fadeInLeft 0.6s ease-out 0.3s both",
              }}
            >
              Exploring new frontiers,
              <br />
              one step at a Time.
            </h1>
          </div>

          {/* Bottom Text */}
          <p
            className="relative z-10 text-white/60 text-sm font-medium"
            style={{
              animation: "fadeInLeft 0.6s ease-out 0.4s both",
            }}
          >
            Beyond Earth's grasp
          </p>

          {/* Astronaut Illustration (Placeholder) */}
          <div className="absolute bottom-0 right-0 w-64 h-64 opacity-20">
            <img
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
              alt="Astronaut"
              className="w-full h-full object-cover rounded-tl-3xl"
            />
          </div>
        </div>

        {/* RIGHT PANEL - Signup Form */}
        <div
          className="lg:w-[55%] p-8 md:p-12 bg-white"
          style={{
            animation: "fadeInRight 0.6s ease-out 0.2s both",
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Create Account
              </h2>
            </div>
            <div className="text-right">
              <span className="text-gray-600 text-sm">Already a member?</span>
              <button className="text-purple-600 font-semibold text-sm hover:text-purple-700 transition-colors ml-1">
                Sign in →
              </button>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] group">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 text-sm font-medium">Google</span>
            </button>

            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] group">
              <svg
                className="w-5 h-5 text-[#1877F2]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-gray-700 text-sm font-medium">
                Facebook
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Or sign up using your email address
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={18} />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Name"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email or Phone no."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <UserCircle size={18} />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                id="terms"
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to all{" "}
                <button
                  type="button"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  terms
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] hover:from-purple-700 hover:to-indigo-700"
            >
              Sign up
            </button>
          </form>

          {/* Bottom Text */}
          <div className="text-center mt-6">
            <span className="text-gray-600 text-sm">
              Already have an account?
            </span>
            <button className="text-purple-600 font-semibold text-sm hover:text-purple-700 ml-1">
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Getstarted;
