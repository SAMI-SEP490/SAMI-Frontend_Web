import React from "react";
import { colors } from "../constants/colors";
import { useNavigate } from "react-router-dom";

const SideBar = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      width: "200px",
      height: "100vh",
      backgroundColor: colors.brand,
      display: "flex",
      flexDirection: "column",
      padding: "20px",
      color: "#fff"
    }}>
      <button onClick={() => (navigate("/contracts"))}
       style={{ margin: "10px 0", background: "none", border: "none", color: "#fff", cursor: "pointer", textAlign: "left" }}>Danh sách hợp đồng</button>
      <button style={{ margin: "10px 0", background: "none", border: "none", color: "#fff", cursor: "pointer", textAlign: "left" }}>Page 2</button>
      <button style={{ margin: "10px 0", background: "none", border: "none", color: "#fff", cursor: "pointer", textAlign: "left" }}>Page 3</button>
      <button style={{ margin: "10px 0", background: "none", border: "none", color: "#fff", cursor: "pointer", textAlign: "left" }}>Page 4</button>
      <button style={{ margin: "10px 0", background: "none", border: "none", color: "#fff", cursor: "pointer", textAlign: "left" }}>Page 5</button>
    </div>
  );
};

export default SideBar;
