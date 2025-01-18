// WalletAdvanced.tsx
"use client"; // or .jsx

import React from "react";

export default function WalletAdvanced() {
  const handleOpenWallet = () => {
    console.log("Wallet opened");
    // Example: open a new popup window at a specific route
    window.open("http://localhost:3004", "_blank", "width=400,height=600");
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
      }}
    >
      <button
        onClick={handleOpenWallet}
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
      >
        WAL
      </button>
    </div>
  );
}
