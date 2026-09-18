import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("mm_user_token");
    localStorage.removeItem("mm_token");
    localStorage.removeItem("mm_user");
    localStorage.removeItem("mm_admin_token");
    localStorage.removeItem("mm_admin");
    localStorage.removeItem("mm_master_token");
    localStorage.removeItem("mm_master");
    localStorage.removeItem("mm_delivery_token");
    localStorage.removeItem("mm_delivery_partner");
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