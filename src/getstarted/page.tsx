import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";
import { useLoader } from "../Loader/loadercontext";

/* COLORS */

const BLACK = "#000000";
const GREY = "#4a4848";
const fg = "#fff";
const tx =
  "color 0.35s ease, background 0.35s ease, border-color 0.35s ease, opacity 0.25s ease";

function useIsMobile(max = 900) {
  const [m, setM] = useState(false);

  useEffect(() => {
    const update = () => setM(window.innerWidth <= max);

    update();

    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, [max]);

  return m;
}

interface RegistrationFormProps {
  onClose?: () => void;
}

export default function RegistrationForm({ onClose }: RegistrationFormProps) {
  const navigate = useNavigate();
  const { showLoader } = useLoader();
  const isMobile = useIsMobile();

  const formRef = useRef<HTMLDivElement>(null);

  const [submitted, setSubmitted] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    school: "",
    role: "",
    count: "",
    interests: [] as string[],
    message: "",
  });

  const interestOptions = [
    "CBT Platform",
    "Question Bank",
    "Proctoring",
    "Analytics",
    "Teacher Management",
    "All of the above",
  ];

  useEffect(() => {
    if (!formRef.current) return;

    gsap.fromTo(
      formRef.current,
      {
        opacity: 0,
        x: 50,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: "power3.out",
      },
    );
  }, []);

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,

      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};

    if (!formData.fullName.trim()) e.fullName = "Required";
    if (!formData.email.trim()) e.email = "Required";
    if (!formData.phone.trim()) e.phone = "Required";
    if (!formData.school.trim()) e.school = "Required";
    if (!formData.role) e.role = "Required";
    if (!formData.count) e.count = "Required";

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const handleClose = () => {
    // If onClose prop is provided, use it
    if (onClose) {
      onClose();
    } else {
      showLoader();

      setTimeout(() => {
        navigate("/");
      }, 50);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      handleClose();
    }, 2000);
  };

  return (
    <div
      className="
fixed
inset-0
z-[1001]
flex
bg-white
overflow-hidden
"
    >
      {/* LEFT PANEL */}

      {!isMobile && (
        <div
          className="
w-[45%]
h-full
bg-black
text-white
flex
flex-col
justify-between
px-8
py-8
"
          style={{
            borderRadius: "0 35px 35px 0",
          }}
        >
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-4 mb-6 flex-shrink-0">
              <span
                style={{
                  width: 0,
                  height: 0,
                  borderTop: `13px solid ${fg}`,
                  borderLeft: "13px solid transparent",
                  transition: tx,
                }}
              />{" "}
              <h2 className="text-xl font-semibold">examly</h2>
            </div>

            {/* Video Section - fills remaining space */}
            <div className="flex-1 flex flex-col min-h-0 gap-5">
              <div className="relative flex-1 w-full rounded-2xl overflow-hidden shadow-2xl">
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    cursor: "grab",
                  }}
                >
                  <source src="/video/teacher.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="flex-shrink-0 pb-2">
                <h1
                  className="
text-3xl
font-bold
leading-tight
"
                >
                  Create or join a school and start managing CBT exams easily
                </h1>

                <p
                  className="
mt-4
text-[#88A99A]
leading-6
text-sm
"
                >
                  Modern onboarding for administrators, teachers and
                  institutions.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[#88A99A] text-sm mt-4 flex-shrink-0">
            Multi-school CBT Platform
          </p>
        </div>
      )}

      {/* RIGHT PANEL */}

      <div
        ref={formRef}
        className="
flex-1
h-full
flex
justify-center
items-center
bg-white
overflow-hidden
"
      >
        <div
          className="
w-full
max-w-[720px]
h-full
flex
flex-col
"
        >
          {/* HEADER */}

          <div
            className="
relative
px-10
pt-10
pb-6
flex-shrink-0
"
          >
            <button
              onClick={handleClose}
              className="
absolute
right-8
top-5
text-4xl
text-gray-400
hover:text-black
transition-colors
"
              style={{
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <h2 className="text-4xl font-semibold">Your Journey Starts Here</h2>

            <p className="mt-3 text-gray-500">
              Schedule a quick session and see how everything works.
            </p>
          </div>

          {/* SCROLL AREA WITH CUSTOM SCROLLBAR */}

          <div
            className="
flex-1
overflow-y-auto
px-10
pb-12
custom-scroll
"
          >
            {submitted ? (
              <div
                className="
h-full
flex
flex-col
items-center
justify-center
"
              >
                <div
                  className="
w-16
h-16
rounded-full
bg-[#2E6F5A]
text-white
flex
items-center
justify-center
text-2xl
"
                >
                  ✓
                </div>

                <h3
                  className="
mt-6
text-2xl
font-semibold
"
                >
                  Request Sent
                </h3>

                <p className="mt-2 text-gray-500">We'll contact you soon</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="
space-y-5
max-w-[620px]
mx-auto
"
              >
                {[
                  ["Full Name", "fullName"],
                  ["Email Address", "email"],
                  ["Phone Number", "phone"],
                  ["School Name", "school"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label
                      className="
block
font-semibold
mb-2
text-sm
"
                    >
                      {label}

                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      value={(formData as any)[key]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [key]: e.target.value,
                        })
                      }
                      className={`
w-full
p-4
rounded-[14px]
border
outline-none
transition

${errors[key] ? "border-red-400" : "border-[rgba(0,0,0,.08)]"}

focus:border-[#2E6F5A]

`}
                    />
                    {errors[key] && (
                      <p className="text-red-500 text-sm mt-1">{errors[key]}</p>
                    )}
                  </div>
                ))}

                <div>
                  <label className="block font-semibold mb-2 text-sm">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value,
                      })
                    }
                    className={`
w-full
p-4
rounded-[14px]
border
outline-none
transition

${errors.role ? "border-red-400" : "border-[rgba(0,0,0,.08)]"}

focus:border-[#2E6F5A]
`}
                  >
                    <option value="">Select Role</option>
                    <option>Teacher</option>
                    <option>Administrator</option>
                    <option>Principal</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold mb-2 text-sm">
                    Student / Teacher Count{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        count: e.target.value,
                      })
                    }
                    className={`
w-full
p-4
rounded-[14px]
border
outline-none
transition

${errors.count ? "border-red-400" : "border-[rgba(0,0,0,.08)]"}

focus:border-[#2E6F5A]
`}
                  >
                    <option value="">Student / Teacher Count</option>
                    <option>Below 200</option>
                    <option>200-500</option>
                    <option>500-1000</option>
                    <option>1000+</option>
                  </select>
                  {errors.count && (
                    <p className="text-red-500 text-sm mt-1">{errors.count}</p>
                  )}
                </div>

                <div>
                  <label
                    className="
font-semibold
block
mb-3
"
                  >
                    Interested In
                  </label>

                  <div
                    className="
flex
flex-wrap
gap-2
"
                  >
                    {interestOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleInterest(opt)}
                        className={`

px-4
py-2
rounded-full
border
transition

${
  formData.interests.includes(opt)
    ? "bg-[#2E6F5A] border-[#2E6F5A] text-white"
    : "border-gray-300 hover:border-[#2E6F5A]"
}

`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={3}
                  placeholder="Message (Optional)"
                  className="
w-full
p-4
rounded-[14px]
border
border-[rgba(0,0,0,.08)]
resize-none
outline-none
focus:border-[#2E6F5A]
transition
"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      message: e.target.value,
                    })
                  }
                />

                <button
                  type="submit"
                  className="
w-full
py-4
rounded-[14px]
text-white
font-semibold
hover:opacity-90
transition-opacity
"
                  style={{
                    background: `linear-gradient(135deg,${BLACK},${GREY})`,
                    boxShadow: "0 12px 32px rgba(31,77,62,.25)",
                    cursor: "pointer",
                  }}
                >
                  Book Demo ›
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Global styles for custom scrollbar */}
      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.25);
        }
        /* Firefox */
        .custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
        }
      `}</style>
    </div>
  );
}
