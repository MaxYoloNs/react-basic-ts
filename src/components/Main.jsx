import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import TicketBoard from "./TicketBoard";
import TicketDetails from "./TicketDetails";

function Main() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<TicketBoard />} />
                <Route path="/ticket/:id" element={<TicketDetails />} />
            </Routes>
        </Router>
    );
}

export default Main;