import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear(); // clears user/admin data
    navigate("/login");
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        backgroundColor: "#e53935",
        color: "#fff",
        padding: "8px 14px",
        borderRadius: "6px",
        border: "none",
        fontWeight: "bold",
        cursor: "pointer",
        zIndex: 1000,
      }}
    >
      Logout
    </button>
  );
}