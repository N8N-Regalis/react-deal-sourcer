import React, { useState } from "react";
import Select from "react-select";
import "./Form.css";

const Form = ({
  partners,
  userEmail,
  onSubmit,
  onTogglePanel,
  panelVisible,
}) => {
  const [partner, setPartner] = useState(null);
  const [listingName, setListingName] = useState("");
  const [listingLink, setListingLink] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [brokerEmail, setBrokerEmail] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const partnerOptions = partners.map((p) => ({ value: p, label: p }));

  const handleSourceTypeChange = (e) => {
    setSourceType(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!partner) errors.partner = true;
    if (!listingName.trim()) errors.listingName = true;
    if (!listingLink.trim()) errors.listingLink = true;
    if (!brokerEmail.trim()) errors.brokerEmail = true;
    if (!sourceType) errors.sourceType = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      alert("Please fill all required fields");
      return;
    }

    setFieldErrors({});

    setIsSubmitting(true);
    setStatus("Submitting...");

    try {
      const result = await onSubmit({
        partner: partner.value.replace(/[❗⭐]/g, ''),
        listingName,
        listingLink,
        brokerage,
        brokerName,
        brokerEmail,
        sourceType,
        notes,
      });

      setStatus(`Saved ${result.id}`);

      // Reset form
      setPartner(null);
      setListingName("");
      setListingLink("");
      setBrokerage("");
      setBrokerName("");
      setBrokerEmail("");
      setSourceType("");
      setNotes("");
    } catch (error) {
      if (error.message === 'This partner and listing link combination already exists') {
        alert("This partner and listing link combination already exists in the Submissions sheet.");
      } else {
        alert("Error saving data");
      }
      setStatus("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2>Deal Sourcing Form</h2>

      <form onSubmit={handleSubmit}>
        <label className={fieldErrors.partner ? "error" : ""}>Partner Name</label>
        <Select
          value={partner}
          onChange={(selectedOption) => {
            setPartner(selectedOption);
            if (fieldErrors.partner) {
              setFieldErrors(prev => ({ ...prev, partner: false }));
            }
          }}
          options={partnerOptions}
          placeholder="-- Select Partner --"
          className="react-select-container"
          classNamePrefix="react-select"
          isDisabled={isSubmitting}
          styles={{
            control: (baseStyles, state) => ({
              ...baseStyles,
              borderColor: fieldErrors.partner ? '#dc2626' : baseStyles.borderColor,
              boxShadow: fieldErrors.partner ? '0 0 0 2px rgba(220, 38, 38, 0.25)' : baseStyles.boxShadow,
              '&:hover': {
                borderColor: fieldErrors.partner ? '#dc2626' : baseStyles['&:hover']?.borderColor,
              },
            }),
          }}
        />

        <label className={fieldErrors.listingName ? "error" : ""}>Listing Name</label>
        <input
          type="text"
          value={listingName}
          onChange={(e) => {
            setListingName(e.target.value);
            if (fieldErrors.listingName) {
              setFieldErrors(prev => ({ ...prev, listingName: false }));
            }
          }}
          disabled={isSubmitting}
          className={fieldErrors.listingName ? "error" : ""}
        />

        <label className={fieldErrors.listingLink ? "error" : ""}>Listing Link</label>
        <input
          type="text"
          value={listingLink}
          onChange={(e) => {
            setListingLink(e.target.value);
            if (fieldErrors.listingLink) {
              setFieldErrors(prev => ({ ...prev, listingLink: false }));
            }
          }}
          disabled={isSubmitting}
          className={fieldErrors.listingLink ? "error" : ""}
        />

        <label>Brokerage</label>
        <input
          type="text"
          value={brokerage}
          onChange={(e) => setBrokerage(e.target.value)}
          disabled={isSubmitting}
        />

        <label>Broker Name</label>
        <input
          type="text"
          value={brokerName}
          onChange={(e) => setBrokerName(e.target.value)}
          disabled={isSubmitting}
        />

        <label className={fieldErrors.brokerEmail ? "error" : ""}>Broker Email</label>
        <input
          type="text"
          value={brokerEmail}
          onChange={(e) => {
            setBrokerEmail(e.target.value);
            if (fieldErrors.brokerEmail) {
              setFieldErrors(prev => ({ ...prev, brokerEmail: false }));
            }
          }}
          disabled={isSubmitting}
          className={fieldErrors.brokerEmail ? "error" : ""}
        />

        <label className={fieldErrors.sourceType ? "error" : ""}>Source Type</label>
        <select
          value={sourceType}
          onChange={(e) => {
            handleSourceTypeChange(e);
            if (fieldErrors.sourceType) {
              setFieldErrors(prev => ({ ...prev, sourceType: false }));
            }
          }}
          disabled={isSubmitting}
          className={fieldErrors.sourceType ? "error" : ""}
        >
          <option value="" disabled>
            -- Select Source Type --
          </option>
          <option value="Resourced">Resourced</option>
          <option value="New">New</option>
        </select>

        <label>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
        />

        <label>User Email</label>
        <input type="text" value={userEmail} readOnly />

        <div className="button-row">
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
          <button type="button" className="glass-btn" onClick={onTogglePanel}>
            {panelVisible ? "Hide Sourced Deals" : "Show Sourced Deals"}
          </button>
        </div>

        {status && (
          <div className="status">
            <span>{status}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default Form;
