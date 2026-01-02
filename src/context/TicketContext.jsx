import React, { createContext, useState, useEffect } from "react";
import ticketsData from "../mock/tickets.json";

export const TicketContext = createContext();

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);

  const updateTicketStatus = (ticketId, newStatus) => {
    setTickets(prevTickets => 
      prevTickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus }
          : ticket
      )
    );
  };

  const getTickets = () => {
    // try {
    //   const tikets = await ticketsData
    //   setTickets(tikets)
    // } catch (error) {
    //   console.log(error)
    // }
    setTickets(ticketsData)
  }

  useEffect(() => {
    getTickets()
  }, [])

  return (
    <TicketContext.Provider value={{ tickets, updateTicketStatus }}>
      {children}
    </TicketContext.Provider>
  );
};
