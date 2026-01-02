import React, { useState, useContext, useMemo } from "react";
import { TicketContext } from "../context/TicketContext";
import TicketCard from "./TicketCard";

const TicketBoard = () => {
  const { tickets } = useContext(TicketContext);
  const [statusFilter, setStatusFilter] = useState("All");
  const [agentFilter, setAgentFilter] = useState("All");

  // 获取所有唯一的代理名称
  const uniqueAgents = useMemo(() => {
    const agents = [...new Set(tickets.map(ticket => ticket.assignedAgent))];
    return agents.sort();
  }, [tickets]);

  // 过滤和排序工单
  const filteredTickets = useMemo(() => {
    let filtered = tickets.filter(ticket => {
      const statusMatch = statusFilter === "All" || ticket.status === statusFilter;
      const agentMatch = agentFilter === "All" || ticket.assignedAgent === agentFilter;
      return statusMatch && agentMatch;
    });

    // 按到期日期升序排序
    filtered.sort((a, b) => {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA - dateB;
    });

    return filtered;
  }, [tickets, statusFilter, agentFilter]);

  return (
    <div className="layout-column align-items-center" data-testid="ticket-board">
      <h3 className="mb-0">Ticket Board</h3>
      <div className="layout-row justify-content-center mb-20">
        <div className="mr-20">
          <label htmlFor="filter-status">Filter by Status: </label>
          <select
            id="filter-status"
            data-testid="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-agent">Filter by Agent: </label>
          <select
            id="filter-agent"
            data-testid="filter-agent"
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
          >
            <option value="All">All</option>
            {uniqueAgents.map(agent => (
              <option key={agent} value={agent}>{agent}</option>
            ))}
          </select>
        </div>
      </div>
      <div data-testid="tickets">
        {filteredTickets.length === 0 ? (
          <div data-testid="no-tickets-found">No tickets found.</div>
        ) : (
          filteredTickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))
        )}
      </div>
    </div>
  );
};

export default TicketBoard;
