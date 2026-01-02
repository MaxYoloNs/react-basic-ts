import React from "react";

const TicketDetails = () => {
  return (
    <div className="layout-column align-items-center">
      <h3 className="mb-0">Ticket Details</h3>
      <div data-testid="ticket-details">
        <h4 className="mb-5">Login Issue</h4>
        <p>
          <strong>Description:</strong> User unable to log into their account.
        </p>
        <p>
          <strong>Assigned Agent:</strong> Alice
        </p>
        <p>
          <strong>Due Date:</strong> 2024-12-10
        </p>
        <p>
          <strong>Status:</strong> Open
        </p>

        <div>
          <label htmlFor="status">Change Status: </label>
          <select data-testid="change-status" id="status" value={"Open"}>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <div className="mt-5 layout-row justify-content-center">
          <button data-testid="save-changes-btn">Save Changes</button>
          <button data-testid="back-to-board-btn">Back to Ticket Board</button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
