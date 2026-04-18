"use client";

import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  getAdditionalUserInfo,
} from "firebase/auth";

interface AuthViewProps {
  onLogin: (user: { id: string; name: string; email: string }, isNewUser: boolean) => void;
  onSkip: () => void;
}

type AuthMode = "login" | "signup" | "forgot";

export default function AuthView({ onLogin, onSkip }: AuthViewProps) {
  const { t } = useLanguage();
  const a = t.auth;
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const text = a;

  const getErrorMessage = (code: string) => {
    switch (code) {
      case "auth/email-already-in-use":
        return a.errEmailInUse;
      case "auth/invalid-email":
        return a.errInvalidEmail;
      case "auth/weak-password":
        return a.errWeakPassword;
      case "auth/user-not-found":
        return a.errUserNotFound;
      case "auth/wrong-password":
        return a.errWrongPassword;
      case "auth/invalid-credential":
        return a.errInvalidCredential;
      case "auth/too-many-requests":
        return a.errTooManyRequests;
      case "auth/popup-closed-by-user":
        return a.errPopupClosed;
      default:
        return a.genericError;
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (mode === "login") {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        onLogin({ 
          id: user.uid,
          name: user.displayName || a.defaultUserName, 
          email: user.email || email 
        }, false);
      } else if (mode === "signup") {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        onLogin({ id: userCredential.user.uid, name, email }, true);
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        alert(a.resetEmailSent);
        setMode("login");
      }
    } catch (err: unknown) {
      const errorCode = (err as { code?: string }).code || "unknown";
      setError(getErrorMessage(errorCode));
    }
    
    setIsLoading(false);
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider !== "Google") {
      alert(a.comingSoon);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);
      const isNewUser = additionalInfo?.isNewUser ?? false;
      onLogin({ 
        id: user.uid,
        name: user.displayName || "Google User", 
        email: user.email || "" 
      }, isNewUser);
    } catch (err: unknown) {
      const errorCode = (err as { code?: string }).code || "unknown";
      setError(getErrorMessage(errorCode));
    }
    
    setIsLoading(false);
  };

  const isFormValid = () => {
    if (mode === "forgot") return email.includes("@");
    if (mode === "signup") return email.includes("@") && password.length >= 6 && name.length > 0;
    return email.includes("@") && password.length >= 6;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#fff5f7",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
        overflowY: "auto",
      }}
    >
      {/* ヘッダー */}
      <div style={{ padding: "60px 24px 32px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌸</div>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1f2937", marginBottom: "8px" }}>
          {mode === "login" ? text.welcome : mode === "signup" ? text.welcomeNew : text.welcomeReset}
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280" }}>
          Trad Trav
        </p>
      </div>

      {/* フォーム */}
      <div style={{ flex: 1, padding: "0 24px", paddingBottom: "40px" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "24px",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* 名前（新規登録のみ） */}
          {mode === "signup" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "8px" }}>
                {text.name}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="trad_trav_user"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  fontSize: "16px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* メールアドレス */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "8px" }}>
              {text.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                fontSize: "16px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* パスワード（ログインと新規登録のみ） */}
          {mode !== "forgot" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "8px" }}>
                {text.password}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "14px 48px 14px 16px",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    fontSize: "16px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "18px",
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          )}

          {/* パスワード忘れた説明 */}
          {mode === "forgot" && (
            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px", lineHeight: "1.6" }}>
              {text.resetDescription}
            </p>
          )}

          {/* パスワードを忘れたリンク */}
          {mode === "login" && (
            <button
              onClick={() => setMode("forgot")}
              style={{
                background: "none",
                border: "none",
                color: "#e88fa3",
                fontSize: "13px",
                cursor: "pointer",
                marginBottom: "20px",
                display: "block",
              }}
            >
              {text.forgotPassword}
            </button>
          )}

          {/* エラーメッセージ */}
          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "16px",
                color: "#dc2626",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {/* 送信ボタン */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isLoading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: isFormValid() && !isLoading ? "#e88fa3" : "#e5e7eb",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              cursor: isFormValid() && !isLoading ? "pointer" : "default",
              marginBottom: "20px",
            }}
          >
            {isLoading ? "..." : mode === "login" ? text.loginButton : mode === "signup" ? text.signupButton : text.resetButton}
          </button>

          {/* ソーシャルログイン（ログインと新規登録のみ） */}
          {mode !== "forgot" && (
            <>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
                <span style={{ padding: "0 16px", fontSize: "13px", color: "#9ca3af" }}>{text.or}</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
              </div>

              {/* Google */}
              <button
                onClick={() => handleSocialLogin("Google")}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "white",
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "#374151",
                  cursor: "pointer",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "20px" }}>🔵</span>
                {text.continueWithGoogle}
              </button>

              {/* Apple */}
              <button
                onClick={() => handleSocialLogin("Apple")}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#000",
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "white",
                  cursor: "pointer",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "18px" }}></span>
                {text.continueWithApple}
              </button>

              {/* LINE */}
              <button
                onClick={() => handleSocialLogin("LINE")}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: "#06C755",
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "18px" }}>💬</span>
                {text.continueWithLine}
              </button>
            </>
          )}
        </div>

        {/* モード切り替え */}
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          {mode === "login" && (
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              {text.noAccount}{" "}
              <button
                onClick={() => setMode("signup")}
                style={{ background: "none", border: "none", color: "#e88fa3", fontWeight: "600", cursor: "pointer" }}
              >
                {text.signup}
              </button>
            </p>
          )}
          {mode === "signup" && (
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              {text.hasAccount}{" "}
              <button
                onClick={() => setMode("login")}
                style={{ background: "none", border: "none", color: "#e88fa3", fontWeight: "600", cursor: "pointer" }}
              >
                {text.login}
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <button
              onClick={() => setMode("login")}
              style={{ background: "none", border: "none", color: "#e88fa3", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
            >
              ← {text.backToLogin}
            </button>
          )}
        </div>

        {/* スキップボタン */}
        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <button
            onClick={onSkip}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              fontSize: "14px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {text.skip}
          </button>
        </div>
      </div>
    </div>
  );
}

