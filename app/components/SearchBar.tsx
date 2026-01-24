"use client";

import { useState } from "react";

export default function SearchBar() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="absolute top-0 left-0 right-0 z-50 safe-area-top">
      <div 
        style={{
          paddingLeft: "20px",
          paddingRight: "20px",
          paddingTop: "28px",
          paddingBottom: "16px",
        }}
      >
        <div 
          className="flex items-center bg-white rounded-full"
          style={{
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.15)",
            paddingLeft: "16px",
            paddingRight: "12px",
            paddingTop: "10px",
            paddingBottom: "10px",
            gap: "12px",
          }}
        >
          {/* 検索アイコン */}
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#666666"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          
          <input
            type="text"
            placeholder="場所を検索..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-base text-gray-800 placeholder-gray-400"
          />
          
          {/* マイクアイコン */}
          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#666666"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

