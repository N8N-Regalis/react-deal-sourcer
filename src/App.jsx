import React, { useState, useEffect } from "react";
import Form from "./components/Form";
import Panel from "./components/Panel";
import Header from "./components/Header";
import SignIn from "./components/SignIn";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  const [partners, setPartners] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [panelVisible, setPanelVisible] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    // Check for saved authentication on mount
    const savedEmail = localStorage.getItem("userEmail");
    if (savedEmail) {
      setUserEmail(savedEmail);
      setIsSignedIn(true);
    }
    loadPartners();
  }, []);

  useEffect(() => {
    if (isSignedIn && userEmail) {
      loadSubmissions();
    }
  }, [isSignedIn, userEmail]);

  const handleSignIn = (email) => {
    setUserEmail(email);
    setIsSignedIn(true);
    localStorage.setItem("userEmail", email);
  };

  const handleSignOut = () => {
    setUserEmail("");
    setIsSignedIn(false);
    localStorage.removeItem("userEmail");
  };

  const isAuthorizedDomain = (email) => {
    return email.endsWith("@regaliscapital.com");
  };

  const loadPartners = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const response = await fetch(`${apiUrl}/partners`);
      const data = await response.json();
      // console.log('Partners loaded:', data)
      setPartners(data);
    } catch (error) {
      console.error("Error loading partners:", error);
      alert("Failed to load partners. Check console for details.");
    }
  };

  const loadSubmissions = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const response = await fetch(
        `${apiUrl}/submissions?email=${encodeURIComponent(userEmail)}`,
      );
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error("Error loading submissions:", error);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const response = await fetch(`${apiUrl}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, user: userEmail }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save data');
      }
      
      const data = await response.json();
      loadSubmissions();
      return data;
    } catch (error) {
      console.error("Error submitting data:", error);
      throw error;
    }
  };

  const togglePanel = () => {
    setPanelVisible(!panelVisible);
  };

  return (
    <div className={`body ${isSignedIn ? "signed-in" : ""}`}>
      {isSignedIn && <Header userEmail={userEmail} onSignOut={handleSignOut} />}

      <div className="container">
        {!isSignedIn ? (
          <SignIn onSignIn={handleSignIn} />
        ) : !isAuthorizedDomain(userEmail) ? (
          <div className="card sign-in-card">
            <h2>Access Denied</h2>
            <p>
              You must sign in with a{" "}
              <span className="domain-highlight">@regaliscapital.com</span>{" "}
              email address to access this form.
            </p>
            <button className="sign-out-button" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        ) : (
          <>
            <Form
              partners={partners}
              userEmail={userEmail}
              onSubmit={handleSubmit}
              onTogglePanel={togglePanel}
              panelVisible={panelVisible}
            />
            {panelVisible && (
              <Panel submissions={submissions} onRefresh={loadSubmissions} />
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
