import React from "react";
import { Link } from "react-router-dom";

const TicketCard = ({ ticket }) => {
    return (
        <div className="ticket-card" data-testid="ticket-card">
            <h3>{ticket.title}</h3>
            <p>
                <strong>Assigned Agent:</strong> {ticket.assignedAgent}
            </p>
            <p>
                <strong>Due Date:</strong> {ticket.dueDate}
            </p>
            <p>{ticket.status}</p>
            <Link to={`/ticket/${ticket.id}`}>View Details</Link>
        </div>
    );
};

export default TicketCard;

