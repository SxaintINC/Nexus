import { useEffect, useRef, useState, useMemo } from "react";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";
import { useLoader } from "../Loader/loadercontext";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../Firebase/firebase";
import { useAlert } from "../Alert/alertcontext";

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

type Role = "School Admin" | "Tutor" | "Exam Candidate";

// Base form data (always present)
interface BaseFormData {
  fullName: string;
  email: string;
  phone: string;
}

// Role-specific data interfaces
interface SchoolAdminData {
  adminName: string;
  schoolName: string;
  schoolAddress: string;
  totalUsers: string;
  interests: string[];
  referralCode: string;
}

interface TutorData {
  tutorName: string;
  tutorCenterName: string;
  tutorCenterAddress: string;
  totalUsers: string;
  interests: string[];
  referralCode: string;
}

interface ExamCandidateData {
  selectedExams: string[];
}

// Combined form state
interface RegistrationFormState {
  base: BaseFormData;
  role: Role | null;
  roleData: SchoolAdminData | TutorData | ExamCandidateData | null;
  password: string;
  confirmPassword: string;
}

// Firestore document structure
interface FirestoreUserData {
  uid: string;
  role: Role;
  profile: {
    fullName: string;
    email: string;
    phone: string;
  };
  roleData: SchoolAdminData | TutorData | ExamCandidateData;
  createdAt: ReturnType<typeof serverTimestamp>;
  verified: boolean;
}

// Field visibility helper
const isSchoolAdmin = (role: Role | null): role is "School Admin" =>
  role === "School Admin";
const isTutor = (role: Role | null): role is "Tutor" => role === "Tutor";
const isExamCandidate = (role: Role | null): role is "Exam Candidate" =>
  role === "Exam Candidate";

const interestOptions = [
  "CBT Platform",
  "Question Bank",
  "Proctoring",
  "Analytics",
  "Teacher Management",
  "All of the above",
];

const examOptions = ["WAEC", "NECO", "JAMB", "GCE"];

// Total users range options
const totalUsersOptions = ["≤50", "50–200", "200–500", "500–1000", "1000+"];

interface RegistrationFormProps {
  onClose?: () => void;
}

// Firebase helper functions
async function createUserAccount(
  email: string,
  password: string,
): Promise<{ user: import("firebase/auth").User; error: string | null }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    let errorMsg = "Something went wrong, try again";
    if (error.code === "auth/email-already-in-use") {
      errorMsg = "Email already registered";
    } else if (error.code === "auth/weak-password") {
      errorMsg = "Password too weak";
    } else if (error.code === "auth/invalid-email") {
      errorMsg = "Invalid email address";
    }
    return { user: null as any, error: errorMsg };
  }
}

async function saveUserToFirestore(
  uid: string,
  role: Role,
  base: BaseFormData,
  roleData: SchoolAdminData | TutorData | ExamCandidateData,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const userData: FirestoreUserData = {
      uid,
      role,
      profile: {
        fullName: base.fullName,
        email: base.email,
        phone: base.phone,
      },
      roleData,
      createdAt: serverTimestamp(),
      verified: false,
    };
    await setDoc(doc(db, "users", uid), userData);
    return { success: true, error: null };
  } catch (error) {
    console.error("Firestore save error:", error);
    return { success: false, error: "Failed to save user data" };
  }
}

export default function RegistrationForm({ onClose }: RegistrationFormProps) {
  const navigate = useNavigate();
  const { showLoader } = useLoader();
  const { showSuccess, showError } = useAlert(); // Use global alert
  const isMobile = useIsMobile();
  const formRef = useRef<HTMLDivElement>(null);
  const fieldsContainerRef = useRef<HTMLDivElement>(null);

  // Multi-step UI state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [hasSelectedRole, setHasSelectedRole] = useState(false);

  // Form state - role starts as null, no role fields shown initially
  const [formState, setFormState] = useState<RegistrationFormState>({
    base: { fullName: "", email: "", phone: "" },
    role: null,
    roleData: null,
    password: "",
    confirmPassword: "",
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derived state for current role data
  const currentRoleData = useMemo(
    () => formState.roleData,
    [formState.roleData],
  );
  const isSchoolAdminMode = isSchoolAdmin(formState.role);
  const isTutorMode = isTutor(formState.role);
  const isExamCandidateMode = isExamCandidate(formState.role);

  // Helper to update base fields
  const updateBaseField = (field: keyof BaseFormData, value: string) => {
    setFormState((prev) => ({
      ...prev,
      base: { ...prev.base, [field]: value },
    }));
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Helper to update role-specific fields
  const updateRoleData = <
    K extends keyof SchoolAdminData | keyof TutorData | keyof ExamCandidateData,
  >(
    field: K,
    value: any,
  ) => {
    if (formState.roleData) {
      setFormState((prev) => {
        if (!prev.roleData) return prev;

        // Create updated roleData with proper type safety
        const updatedRoleData = {
          ...prev.roleData,
          [field]: value,
        } as SchoolAdminData | TutorData | ExamCandidateData;

        return {
          ...prev,
          roleData: updatedRoleData,
        };
      });

      // Clear error for this field if it exists
      if (errors[field as string]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });
      }
    }
  };

  // Toggle interest chips (for School Admin & Tutor)
  const toggleInterest = (interest: string) => {
    if ((isSchoolAdminMode || isTutorMode) && currentRoleData) {
      const currentInterests =
        (currentRoleData as SchoolAdminData | TutorData).interests || [];
      const newInterests = currentInterests.includes(interest)
        ? currentInterests.filter((i) => i !== interest)
        : [...currentInterests, interest];
      updateRoleData("interests", newInterests);
    }
  };

  // Toggle exam selection (for Exam Candidate)
  const toggleExam = (exam: string) => {
    if (isExamCandidateMode && currentRoleData) {
      const currentExams =
        (currentRoleData as ExamCandidateData).selectedExams || [];
      const newExams = currentExams.includes(exam)
        ? currentExams.filter((e) => e !== exam)
        : [...currentExams, exam];
      updateRoleData("selectedExams", newExams);
    }
  };

  // Select all exams toggle
  const toggleAllExams = () => {
    if (isExamCandidateMode && currentRoleData) {
      const currentExams =
        (currentRoleData as ExamCandidateData).selectedExams || [];
      const allSelected = examOptions.every((exam) =>
        currentExams.includes(exam),
      );
      const newExams = allSelected ? [] : [...examOptions];
      updateRoleData("selectedExams", newExams);
    }
  };

  // Role change handler - resets roleData completely
  const handleRoleChange = (newRole: Role) => {
    if (newRole === formState.role) return;

    // Animate out current fields
    if (fieldsContainerRef.current) {
      gsap.to(fieldsContainerRef.current.children, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        stagger: 0.02,
        onComplete: () => {
          setHasSelectedRole(true);
          // Initialize role-specific data when switching
          let newRoleData: SchoolAdminData | TutorData | ExamCandidateData;
          if (newRole === "School Admin") {
            newRoleData = {
              adminName: "",
              schoolName: "",
              schoolAddress: "",
              totalUsers: "",
              interests: [],
              referralCode: "",
            };
          } else if (newRole === "Tutor") {
            newRoleData = {
              tutorName: "",
              tutorCenterName: "",
              tutorCenterAddress: "",
              totalUsers: "",
              interests: [],
              referralCode: "",
            };
          } else {
            newRoleData = {
              selectedExams: [],
            };
          }

          setFormState((prev) => ({
            ...prev,
            role: newRole,
            roleData: newRoleData,
          }));

          // Clear role-specific errors
          setErrors((prev) => {
            const newErrors = { ...prev };
            const roleFields = [
              "adminName",
              "schoolName",
              "schoolAddress",
              "totalUsers",
              "tutorName",
              "tutorCenterName",
              "tutorCenterAddress",
              "selectedExams",
            ];
            roleFields.forEach((field) => delete newErrors[field]);
            return newErrors;
          });
        },
      });
    } else {
      setHasSelectedRole(true);
      let newRoleData: SchoolAdminData | TutorData | ExamCandidateData;
      if (newRole === "School Admin") {
        newRoleData = {
          adminName: "",
          schoolName: "",
          schoolAddress: "",
          totalUsers: "",
          interests: [],
          referralCode: "",
        };
      } else if (newRole === "Tutor") {
        newRoleData = {
          tutorName: "",
          tutorCenterName: "",
          tutorCenterAddress: "",
          totalUsers: "",
          interests: [],
          referralCode: "",
        };
      } else {
        newRoleData = {
          selectedExams: [],
        };
      }

      setFormState((prev) => ({
        ...prev,
        role: newRole,
        roleData: newRoleData,
      }));
    }
  };

  // Validate basic info and role-specific fields
  const validateBasicAndRoleFields = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Base validation
    if (!formState.base.fullName.trim()) newErrors.fullName = "Required";
    if (!formState.base.email.trim()) newErrors.email = "Required";
    if (!formState.base.phone.trim()) newErrors.phone = "Required";

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formState.base.email.trim() && !emailRegex.test(formState.base.email)) {
      newErrors.email = "Invalid email format";
    }

    // Phone format validation (basic)
    const phoneRegex = /^[\d+\-\s()]{8,}$/;
    if (formState.base.phone.trim() && !phoneRegex.test(formState.base.phone)) {
      newErrors.phone = "Invalid phone number";
    }

    // Role-specific validation
    if (isSchoolAdminMode && currentRoleData) {
      const data = currentRoleData as SchoolAdminData;
      if (!data.adminName?.trim()) newErrors.adminName = "Required";
      if (!data.schoolName?.trim()) newErrors.schoolName = "Required";
      if (!data.schoolAddress?.trim()) newErrors.schoolAddress = "Required";
      if (!data.totalUsers) newErrors.totalUsers = "Required";
    } else if (isTutorMode && currentRoleData) {
      const data = currentRoleData as TutorData;
      if (!data.tutorName?.trim()) newErrors.tutorName = "Required";
      if (!data.tutorCenterName?.trim()) newErrors.tutorCenterName = "Required";
      if (!data.tutorCenterAddress?.trim())
        newErrors.tutorCenterAddress = "Required";
      if (!data.totalUsers) newErrors.totalUsers = "Required";
    } else if (isExamCandidateMode && currentRoleData) {
      const data = currentRoleData as ExamCandidateData;
      if (!data.selectedExams || data.selectedExams.length === 0) {
        newErrors.selectedExams = "Select at least one exam";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showError("Please fix the errors before continuing"); // Using global error alert
    }
    return Object.keys(newErrors).length === 0;
  };

  // Handle Book Demo button click (opens password modal)
  const handleBookDemo = () => {
    if (validateBasicAndRoleFields()) {
      setPasswordError("");
      setShowPasswordModal(true);
    }
  };

  // Validate password fields
  const validatePasswords = (): boolean => {
    const pwd = formState.password;
    const confirm = formState.confirmPassword;

    if (!pwd) {
      setPasswordError("Password is required");
      return false;
    }
    if (pwd.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    if (pwd !== confirm) {
      setPasswordError("Passwords do not match");
      return false;
    }
    setPasswordError("");
    return true;
  };

  // Firebase registration and data saving
  const handlePasswordSubmit = async () => {
    if (!validatePasswords()) return;
    if (isCreatingAccount) return; // Prevent double submission
    if (!formState.role || !formState.roleData) return;

    setIsCreatingAccount(true);
    showLoader();

    try {
      // 1. Create Firebase account
      const { user, error: createError } = await createUserAccount(
        formState.base.email,
        formState.password,
      );

      if (createError || !user) {
        showError(createError || "Account creation failed"); // Using global error alert
        setIsCreatingAccount(false);
        showLoader();
        return;
      }

      // 2. Send email verification
      try {
        await sendEmailVerification(user);
        // Using global success alert
      } catch (verifyError) {
        console.error("Email verification error:", verifyError);
        showError(
          "Failed to send verification email. You can request it later.",
        ); // Using global error alert
        // Continue anyway - user can request verification later
      }

      // 3. Save to Firestore
      const { success: saveSuccess, error: saveError } =
        await saveUserToFirestore(
          user.uid,
          formState.role,
          formState.base,
          formState.roleData,
        );

      if (!saveSuccess) {
        showError(saveError || "Failed to save user data"); // Using global error alert
        // Account was created but data not saved - could implement retry
      }

      // 4. Show success state
      setShowPasswordModal(false);
      setTimeout(() => {
        setSubmitted(true);
        showSuccess("Account created successfully! Please verify your email ");
      }, 400);
    } catch (error: any) {
      console.error("Registration error:", error);
      showError("Something went wrong, try again"); // Using global error alert
    } finally {
      setIsCreatingAccount(false);
      showLoader();
    }
  };

  // Close handler - FIXED VERSION
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      showLoader();
      navigate("/");
    }
  };

  // Entrance animation
  useEffect(() => {
    if (!formRef.current) return;
    gsap.fromTo(
      formRef.current,
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" },
    );
  }, []);

  // Animate role-specific fields when they appear
  useEffect(() => {
    if (hasSelectedRole && fieldsContainerRef.current && formState.role) {
      gsap.fromTo(
        fieldsContainerRef.current.children,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: "back.out(0.7)",
        },
      );
    }
  }, [formState.role, hasSelectedRole]);

  // Modal open/close animation
  useEffect(() => {
    if (showPasswordModal) {
      gsap.fromTo(
        ".password-modal-content",
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(0.6)" },
      );
    }
  }, [showPasswordModal]);

  // Check if Book Demo button should be disabled
  const isBookDemoDisabled = useMemo(() => {
    // Base fields required
    if (
      !formState.base.fullName.trim() ||
      !formState.base.email.trim() ||
      !formState.base.phone.trim()
    )
      return true;

    // Must have selected a role
    if (!formState.role) return true;

    // Role-specific validation
    if (isSchoolAdminMode && currentRoleData) {
      const data = currentRoleData as SchoolAdminData;
      return (
        !data.adminName?.trim() ||
        !data.schoolName?.trim() ||
        !data.schoolAddress?.trim() ||
        !data.totalUsers
      );
    }
    if (isTutorMode && currentRoleData) {
      const data = currentRoleData as TutorData;
      return (
        !data.tutorName?.trim() ||
        !data.tutorCenterName?.trim() ||
        !data.tutorCenterAddress?.trim() ||
        !data.totalUsers
      );
    }
    if (isExamCandidateMode && currentRoleData) {
      const data = currentRoleData as ExamCandidateData;
      return !data.selectedExams || data.selectedExams.length === 0;
    }
    return false;
  }, [
    formState.base,
    formState.role,
    currentRoleData,
    isSchoolAdminMode,
    isTutorMode,
    isExamCandidateMode,
  ]);

  // Render role selection buttons (horizontal, black styled)
  const renderRoleButtons = () => {
    const roles: Role[] = ["School Admin", "Tutor", "Exam Candidate"];
    return (
      <div className="flex flex-wrap gap-3 mt-2">
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => handleRoleChange(role)}
            className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
              formState.role === role
                ? "bg-black text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {role}
          </button>
        ))}
      </div>
    );
  };

  // Render role-specific fields (only shown after role selected)
  const renderRoleFields = () => {
    if (!formState.role || !currentRoleData) return null;

    if (isSchoolAdminMode) {
      const data = currentRoleData as SchoolAdminData;
      return (
        <div className="space-y-5">
          <div>
            <label className="block font-semibold mb-2 text-sm">
              Admin Name <span className="text-red-500">*</span>
            </label>
            <input
              value={data.adminName}
              onChange={(e) => updateRoleData("adminName", e.target.value)}
              className={`w-full p-4 rounded-[14px] border outline-none transition ${
                errors.adminName
                  ? "border-red-400"
                  : "border-[rgba(0,0,0,.08)] focus:border-black"
              }`}
            />
            {errors.adminName && (
              <p className="text-red-500 text-sm mt-1">{errors.adminName}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold mb-2 text-sm">
              School Name <span className="text-red-500">*</span>
            </label>
            <input
              value={data.schoolName}
              onChange={(e) => updateRoleData("schoolName", e.target.value)}
              className={`w-full p-4 rounded-[14px] border outline-none transition ${
                errors.schoolName
                  ? "border-red-400"
                  : "border-[rgba(0,0,0,.08)] focus:border-black"
              }`}
            />
            {errors.schoolName && (
              <p className="text-red-500 text-sm mt-1">{errors.schoolName}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold mb-2 text-sm">
              School Address <span className="text-red-500">*</span>
            </label>
            <input
              value={data.schoolAddress}
              onChange={(e) => updateRoleData("schoolAddress", e.target.value)}
              className={`w-full p-4 rounded-[14px] border outline-none transition ${
                errors.schoolAddress
                  ? "border-red-400"
                  : "border-[rgba(0,0,0,.08)] focus:border-black"
              }`}
            />
            {errors.schoolAddress && (
              <p className="text-red-500 text-sm mt-1">
                {errors.schoolAddress}
              </p>
            )}
          </div>
          <div>
            <label className="block font-semibold mb-2 text-sm">
              Total Users <span className="text-red-500">*</span>
            </label>
            <select
              value={data.totalUsers}
              onChange={(e) => updateRoleData("totalUsers", e.target.value)}
              className={`w-full p-4 rounded-[14px] border outline-none transition ${
                errors.totalUsers
                  ? "border-red-400"
                  : "border-[rgba(0,0,0,.08)] focus:border-black"
              }`}
            >
              <option value="">Select range</option>
              {totalUsersOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.totalUsers && (
              <p className="text-red-500 text-sm mt-1">{errors.totalUsers}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold mb-3">Interested In</label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleInterest(opt)}
                  className={`px-4 py-2 rounded-full border transition ${
                    data.interests.includes(opt)
                      ? "bg-black border-black text-white"
                      : "border-gray-300 hover:border-black"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-2 text-sm">
              Referral Code (Optional)
            </label>
            <input
              value={data.referralCode}
              onChange={(e) => updateRoleData("referralCode", e.target.value)}
              className="w-full p-4 rounded-[14px] border border-[rgba(0,0,0,.08)] outline-none focus:border-black transition"
            />
          </div>
        </div>
      );
    }

    if (isTutorMode) {
      const data = currentRoleData as TutorData;
      return (
        <div className="space-y-5">
          <div>
            <label className="block font-semibold mb-2 text-sm">
              Tutor Name <span className="text-red-500">*</span>
            </label>
            <input
              value={data.tutorName}
              onChange={(e) => updateRoleData("tutorName", e.target.value)}
              className={`w-full p-4 rounded-[14px] border outline-none transition ${
                errors.tutorName
                  ? "border-red-400"
                  : "border-[rgba(0,0,0,.08)] focus:border-black"
              }`}
            />
            {errors.tutorName && (
              <p className="text-red-500 text-sm mt-1">{errors.tutorName}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold mb-2 text-sm">
              Tutor Center Name <span className="text-red-500">*</span>
            </label>
            <input
              value={data.tutorCenterName}
              onChange={(e) =>
                updateRoleData("tutorCenterName", e.target.value)
              }
              className={`w-full p-4 rounded-[14px] border outline-none transition ${
                errors.tutorCenterName
                  ? "border-red-400"
                  : "border-[rgba(0,0,0,.08)] focus:border-black"
              }`}
            />
            {errors.tutorCenterName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.tutorCenterName}
              </p>
            )}
          </div>
          <div>
            <label className="block font-semibold mb-2 text-sm">
              Tutor Center Address <span className="text-red-500">*</span>
            </label>
            <input
              value={data.tutorCenterAddress}
              onChange={(e) =>
                updateRoleData("tutorCenterAddress", e.target.value)
              }
              className={`w-full p-4 rounded-[14px] border outline-none transition ${
                errors.tutorCenterAddress
                  ? "border-red-400"
                  : "border-[rgba(0,0,0,.08)] focus:border-black"
              }`}
            />
            {errors.tutorCenterAddress && (
              <p className="text-red-500 text-sm mt-1">
                {errors.tutorCenterAddress}
              </p>
            )}
          </div>
          <div>
            <label className="block font-semibold mb-2 text-sm">
              Total Users <span className="text-red-500">*</span>
            </label>
            <select
              value={data.totalUsers}
              onChange={(e) => updateRoleData("totalUsers", e.target.value)}
              className={`w-full p-4 rounded-[14px] border outline-none transition ${
                errors.totalUsers
                  ? "border-red-400"
                  : "border-[rgba(0,0,0,.08)] focus:border-black"
              }`}
            >
              <option value="">Select range</option>
              {totalUsersOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.totalUsers && (
              <p className="text-red-500 text-sm mt-1">{errors.totalUsers}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold mb-3">Interested In</label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleInterest(opt)}
                  className={`px-4 py-2 rounded-full border transition ${
                    data.interests.includes(opt)
                      ? "bg-black border-black text-white"
                      : "border-gray-300 hover:border-black"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-2 text-sm">
              Referral Code (Optional)
            </label>
            <input
              value={data.referralCode}
              onChange={(e) => updateRoleData("referralCode", e.target.value)}
              className="w-full p-4 rounded-[14px] border border-[rgba(0,0,0,.08)] outline-none focus:border-black transition"
            />
          </div>
        </div>
      );
    }

    if (isExamCandidateMode) {
      const data = currentRoleData as ExamCandidateData;
      const allSelected = examOptions.every((exam) =>
        data.selectedExams?.includes(exam),
      );
      return (
        <div className="space-y-5">
          <div>
            <label className="block font-semibold mb-3">
              Select Exam Types <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {examOptions.map((exam) => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => toggleExam(exam)}
                  className={`px-5 py-2.5 rounded-full font-medium border transition ${
                    data.selectedExams?.includes(exam)
                      ? "bg-black border-black text-white"
                      : "border-gray-300 hover:border-black text-gray-700"
                  }`}
                >
                  {exam}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={toggleAllExams}
              className="px-4 py-2 rounded-full text-sm border border-gray-300 hover:border-black transition"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
            {errors.selectedExams && (
              <p className="text-red-500 text-sm mt-2">
                {errors.selectedExams}
              </p>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-[1001] flex bg-white overflow-hidden">
      {/* LEFT PANEL */}
      {!isMobile && (
        <div
          className="w-[45%] h-full bg-black text-white flex flex-col justify-between px-8 py-8"
          style={{ borderRadius: "0 35px 35px 0" }}
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
              />
              <h2 className="text-xl font-semibold">examly</h2>
            </div>
            <div className="flex-1 flex flex-col min-h-0 gap-5">
              <div className="relative flex-1 w-full rounded-2xl overflow-hidden shadow-2xl">
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src="/video/teacher.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="flex-shrink-0 pb-2">
                <h1 className="text-3xl font-bold leading-tight">
                  Create or join a school and start managing CBT exams easily
                </h1>
                <p className="mt-4 text-[#88A99A] leading-6 text-sm">
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
        className="flex-1 h-full flex justify-center items-center bg-white overflow-hidden"
      >
        <div className="w-full max-w-[720px] h-full flex flex-col">
          {/* HEADER */}
          <div className="relative px-10 pt-10 pb-6 flex-shrink-0">
            <button
              onClick={handleClose}
              className="absolute right-8 top-5 text-4xl text-gray-400 hover:text-black transition-colors cursor-pointer"
            >
              ×
            </button>
            <h2 className="text-4xl font-semibold">Your Journey Starts Here</h2>
            <p className="mt-3 text-gray-500">
              Schedule a quick session and see how everything works.
            </p>
          </div>

          {/* SCROLL AREA */}
          <div className="flex-1 overflow-y-auto px-10 pb-12 custom-scroll">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-2xl animate-bounce">
                  ✓
                </div>
                <h3 className="mt-6 text-2xl font-semibold">Account Created</h3>
                <p className="mt-2 text-gray-500 text-center">
                  Verification email sent to your inbox. Please verify your
                  email before logging in.
                </p>
              </div>
            ) : (
              <div className="max-w-[620px] mx-auto space-y-6">
                {/* STEP 1: Basic Info (always visible) */}
                <div className="space-y-5">
                  <div>
                    <label className="block font-semibold mb-2 text-sm">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={formState.base.fullName}
                      onChange={(e) =>
                        updateBaseField("fullName", e.target.value)
                      }
                      className={`w-full p-4 rounded-[14px] border outline-none transition ${
                        errors.fullName
                          ? "border-red-400"
                          : "border-[rgba(0,0,0,.08)] focus:border-black"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold mb-2 text-sm">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formState.base.email}
                      onChange={(e) => updateBaseField("email", e.target.value)}
                      className={`w-full p-4 rounded-[14px] border outline-none transition ${
                        errors.email
                          ? "border-red-400"
                          : "border-[rgba(0,0,0,.08)] focus:border-black"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold mb-2 text-sm">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={formState.base.phone}
                      onChange={(e) => updateBaseField("phone", e.target.value)}
                      className={`w-full p-4 rounded-[14px] border outline-none transition ${
                        errors.phone
                          ? "border-red-400"
                          : "border-[rgba(0,0,0,.08)] focus:border-black"
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role Selection Buttons - Always visible */}
                <div>
                  <label className="block font-semibold text-sm mb-2">
                    Select Role <span className="text-red-500">*</span>
                  </label>
                  {renderRoleButtons()}
                </div>

                {/* Dynamic Role Fields - Only shown after role selected */}
                {formState.role && (
                  <div ref={fieldsContainerRef}>{renderRoleFields()}</div>
                )}

                {/* Book Demo Button */}
                <button
                  type="button"
                  onClick={handleBookDemo}
                  disabled={isBookDemoDisabled}
                  className={`w-full py-4 rounded-[14px] text-white font-semibold transition-all ${
                    isBookDemoDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-90 cursor-pointer"
                  }`}
                  style={{
                    background: `linear-gradient(135deg,${BLACK},${GREY})`,
                    boxShadow: "0 12px 32px rgba(0,0,0,.25)",
                  }}
                >
                  Book Demo ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="password-modal-content bg-white rounded-2xl w-full max-w-md p-8 mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-semibold mb-2">Create Password</h3>
            <p className="text-gray-500 mb-6">
              Set a password to secure your account
            </p>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2 text-sm">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formState.password}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-black outline-none transition"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-sm">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formState.confirmPassword}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-black outline-none transition"
                />
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={isCreatingAccount}
                  className={`flex-1 py-3 rounded-xl bg-black text-white font-semibold transition ${
                    isCreatingAccount
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-gray-800"
                  }`}
                >
                  {isCreatingAccount ? "Creating account..." : "Create Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar & Animation Styles */}
      <style>{`
  .custom-scroll::-webkit-scrollbar { width: 4px; }
  .custom-scroll::-webkit-scrollbar-track { background: transparent; }
  .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
  .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
  .custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent; }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }
`}</style>
    </div>
  );
}
