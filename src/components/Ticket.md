<!-- 需求文档 -->
React: Customer Support Ticketing Portal
Complete a partially completed React application as shown below to pass all the unit tests. Certain core React functionalities are already implemented.

Hide animation
An example of how the customer support ticketing portal ought to function
 

The application should have the following functionalities:

 

General Functionality
The Ticket Board should:
Display all tickets by default.
Dynamically update the displayed tickets based on the selected filters.
Routes
Home Page (/):

Display the Ticket Board with all tickets provided in src/tickets.json sorted by their due date in ascending order.
Each ticket card should display the following:
Ticket title.
Assigned agent name.
Due date.
Current status.
Ticket Details (/ticket/:id):

Clicking the View Details button should navigate to the above route and display the selected ticket's details, including:
Description.
Current status with a dropdown to change it.
Include a Back to Board button to return to the Ticket Board.
Filtering
Add dropdown filters on the Ticket Board:
Filter by Status should include:
All.
Open.
In Progress.
Resolved.
Filter by Agent should include:
All.
Unique agent names are dynamically populated from the tickets.
When a filter combination results in no matching tickets:
Display a message: "No tickets found.".
Status Updates
On the Ticket Details page:
The ticket’s status should be changeable using a dropdown.
A Save Changes button should be provided to persist the updated status.
After saving, display an alert "Ticket status has been updated successfully!" confirming the status change.
Ensure the following behavior:
If the status is changed and saved, the Ticket Board reflects the updated status.
If the status is changed but not saved, the Ticket Board reflects the original status upon returning.
The following data-testid attributes are required in the component for the tests to pass:

 

Table of data-testid
Attribute	Component
ticket-board	Component displaying the Ticket Board.
filter-status	Dropdown for filtering tickets by status.
filter-agent	Dropdown for filtering tickets by agent.
tickets	Container for the list of filtered tickets.
no-tickets-found	Message displayed when no tickets are found on changing the filters
ticket-card	
Individual ticket card displaying ticket details.
ticket-details	Component displaying details of a selected ticket.
change-status	Dropdown to change the status of a ticket.
save-changes-btn	Button to save changes to the ticket's status.
back-to-board-btn	Button to navigate back to the Ticket Board.
 

Note:

Components have data-testid attributes for test cases and certain classes and IDs for rendering purposes. They should not be changed.
All the tickets are provided in the file src/tickets.json.
The files that should be modified are src/components/Main.js, src/components/TicketBoard.js, src/components/TicketCard.js, src/components/TicketDetails.js, and src/context/TicketContext.js. They are open by default in the system editor.
Avoid making changes to other files in the project structure.